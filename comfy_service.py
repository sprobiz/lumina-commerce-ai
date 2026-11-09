"""
comfy_service.py - ComfyUI REST 및 WebSocket 통신 서비스
ComfyUI가 실행 중이지 않을 때는 개발 및 테스트를 위한 Fallback(데모 생성) 모드로 동작합니다.
"""

import json
import uuid
import os
import time
import asyncio
import aiohttp
import random
from typing import Dict, Any, Optional, Callable
from PIL import Image, ImageDraw, ImageFont

class ComfyService:
    def __init__(self, base_url: str = "http://127.0.0.1:8188", output_dir: str = "./outputs", timeout_seconds: int = 300):
        self.base_url = base_url.rstrip("/")
        self.output_dir = output_dir
        self.timeout_seconds = timeout_seconds
        os.makedirs(self.output_dir, exist_ok=True)
        self.client_id = str(uuid.uuid4())

    def _check_socket(self, host: str, port: int) -> bool:
        import socket
        try:
            with socket.create_connection((host, port), timeout=0.3):
                return True
        except Exception:
            return False

    async def is_comfy_online(self) -> bool:
        """ComfyUI 서버 가동 여부 확인"""
        # 로컬 포트 8188 체크 (초고속 동기식 소켓 체크)
        if not self._check_socket("127.0.0.1", 8188):
            return False

        try:
            timeout = aiohttp.ClientTimeout(total=1.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{self.base_url}/system_stats") as resp:
                    return resp.status == 200
        except Exception:
            return False

    async def upload_image(self, file_bytes: bytes, filename: str) -> str:
        """ComfyUI 서버의 /upload/image 로 이미지 업로드"""
        unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        local_upload_dir = os.path.join(self.output_dir, "uploads")
        os.makedirs(local_upload_dir, exist_ok=True)
        local_path = os.path.join(local_upload_dir, unique_name)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        is_online = await self.is_comfy_online()
        if is_online:
            try:
                async with aiohttp.ClientSession() as session:
                    data = aiohttp.FormData()
                    data.add_field('image', file_bytes, filename=unique_name, content_type='image/png')
                    data.add_field('overwrite', 'true')
                    async with session.post(f"{self.base_url}/upload/image", data=data) as resp:
                        if resp.status == 200:
                            res_json = await resp.json()
                            return res_json.get("name", unique_name)
            except Exception as e:
                print(f"[ComfyService] ComfyUI image upload warning: {e}")

        return unique_name

    def build_standard_workflow(self, prompt: str, negative_prompt: str = "", width: int = 1024, height: int = 1024, seed: int = None, image_filename: Optional[str] = None, denoise: float = 1.0) -> Dict[str, Any]:
        """
        Qwen-Image 2.1 Turbo (4비트 GGUF) 공식 8~10노드 파이프라인
        - Text-to-Image 및 Image-Text-to-Image (멀티모달 참조 및 Img2Img) 지원
        """
        if seed is None or seed < 0:
            seed = random.randint(1, 1000000000)

        workflow = {
            "1": {
                "inputs": {
                    "unet_name": "qwen-image-2.1-turbo-Q4_K_M.gguf"
                },
                "class_type": "UnetLoaderGGUF"
            },
            "2": {
                "inputs": {
                    "clip_name": "qwen3vl_8b_w4a8.safetensors",
                    "type": "qwen_image"
                },
                "class_type": "CLIPLoader"
            },
            "3": {
                "inputs": {
                    "vae_name": "qwen_image_2.1_vae_bf16.safetensors"
                },
                "class_type": "VAELoader"
            },
            "4": {
                "inputs": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "resolution": max(width, height),
                    "clip": ["2", 0]
                },
                "class_type": "TextEncodeQwenImage21"
            },
            "5": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "seed": seed,
                    "steps": 8,
                    "cfg": 1.0,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "denoise": float(denoise) if denoise is not None else 1.0,
                    "model": ["1", 0],
                    "positive": ["4", 0],
                    "negative": ["4", 1],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "7": {
                "inputs": {
                    "samples": ["6", 0],
                    "vae": ["3", 0]
                },
                "class_type": "VAEDecode"
            },
            "8": {
                "inputs": {
                    "filename_prefix": "LuminaAI",
                    "images": ["7", 0]
                },
                "class_type": "SaveImage"
            }
        }

        # Image-to-Image 모드 설정 (참조 이미지가 제공된 경우)
        if image_filename:
            workflow["9"] = {
                "inputs": {
                    "image": image_filename
                },
                "class_type": "LoadImage"
            }
            # Qwen3-VL 비전 언어 인코더(Node 4)에 참조 이미지(image_1)와 VAE 직접 연결 -> 인물의 실제 얼굴/이목구비 직접 인식!
            workflow["4"]["inputs"]["vae"] = ["3", 0]
            workflow["4"]["inputs"]["image_1"] = ["9", 0]

            # 원본 이미지를 VAE 인코딩하여 Latent 도화지로 연결
            workflow["10"] = {
                "inputs": {
                    "pixels": ["9", 0],
                    "vae": ["3", 0]
                },
                "class_type": "VAEEncode"
            }
            # KSampler의 시작 Latent를 원본 이미지 Latent로 교체하고 사용자가 설정한 denoise 변형 강도 적용
            workflow["6"]["inputs"]["latent_image"] = ["10", 0]
            workflow["6"]["inputs"]["denoise"] = float(denoise) if denoise is not None else 0.50

        return workflow

    async def generate_image(self, prompt: str, negative_prompt: str = "", width: int = 512, height: int = 512, seed: int = None, image_filename: Optional[str] = None, denoise: float = 1.0, progress_callback: Optional[Callable[[int, int], None]] = None) -> Dict[str, Any]:
        """이미지 생성 요청 및 결과 이미지 획득"""
        gen_id = str(uuid.uuid4())[:8]
        if seed is None or seed < 0:
            seed = random.randint(1, 1000000000)

        is_online = await self.is_comfy_online()
        if not is_online:
            # Fallback 모드 (ComfyUI 오프라인 시 데모 이미지 생성)
            return await self._generate_fallback(gen_id, prompt, negative_prompt, width, height, seed, image_filename, denoise, progress_callback)

        workflow = self.build_standard_workflow(prompt, negative_prompt, width, height, seed, image_filename, denoise)
        payload = {
            "prompt": workflow,
            "client_id": self.client_id
        }

        async with aiohttp.ClientSession() as session:
            # 1. 큐 등록
            async with session.post(f"{self.base_url}/prompt", json=payload) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise RuntimeError(f"ComfyUI 요청 실패 ({resp.status}): {text}")
                res_data = await resp.json()
                prompt_id = res_data.get("prompt_id")

            # 2. 실행 완료 대기 (WebSocket 또는 폴링)
            img_info = await self._wait_for_completion(session, prompt_id, progress_callback, timeout=self.timeout_seconds)
            
            # 3. 이미지 다운로드 및 로컬 캐싱
            local_filename = f"gen_{gen_id}.png"
            local_path = os.path.join(self.output_dir, local_filename)

            img_fname = img_info.get("filename", "")
            img_sub = img_info.get("subfolder", "")
            img_type = img_info.get("type", "output")

            async with session.get(f"{self.base_url}/view?filename={img_fname}&subfolder={img_sub}&type={img_type}") as img_resp:
                if img_resp.status == 200:
                    img_bytes = await img_resp.read()
                    with open(local_path, "wb") as f:
                        f.write(img_bytes)
                else:
                    raise RuntimeError("생성된 이미지를 다운로드하지 못했습니다.")

        return {
            "id": gen_id,
            "image_url": f"/outputs/{local_filename}",
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "seed": seed,
            "mode": "comfyui_live"
        }

    async def _wait_for_completion(self, session: aiohttp.ClientSession, prompt_id: str, progress_callback: Optional[Callable[[int, int], None]] = None, timeout: int = 120) -> Dict[str, Any]:
        """ComfyUI History 폴링을 통한 결과 대기"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            async with session.get(f"{self.base_url}/history/{prompt_id}") as resp:
                if resp.status == 200:
                    history = await resp.json()
                    if prompt_id in history:
                        item = history[prompt_id]
                        status = item.get("status", {})
                        if status.get("status_str") == "error":
                            err_msg = "ComfyUI 렌더링 중 오류가 발생했습니다."
                            for msg in status.get("messages", []):
                                if msg[0] == "execution_error":
                                    err_msg = msg[1].get("exception_message", err_msg)
                            raise RuntimeError(err_msg)

                        outputs = item.get("outputs", {})
                        for node_id, node_out in outputs.items():
                            if "images" in node_out and len(node_out["images"]) > 0:
                                return node_out["images"][0]
            await asyncio.sleep(1.0)
            if progress_callback:
                elapsed = int(time.time() - start_time)
                progress_callback(min(elapsed * 5, 95), 100)

        raise TimeoutError(f"ComfyUI 이미지 생성 제한 시간({timeout}초)을 초과했습니다.")

    async def _generate_fallback(self, gen_id: str, prompt: str, negative_prompt: str, width: int, height: int, seed: int, image_filename: Optional[str] = None, denoise: float = 1.0, progress_callback: Optional[Callable[[int, int], None]] = None) -> Dict[str, Any]:
        """ComfyUI 미구동 시 서비스 테스트를 위한 안내용 데모 이미지 생성"""
        # 진행률 애니메이션 시뮬레이션
        for p in range(20, 101, 20):
            await asyncio.sleep(0.05)
            if progress_callback:
                progress_callback(p, 100)

        local_filename = f"demo_{gen_id}.png"
        local_path = os.path.join(self.output_dir, local_filename)

        # 캔버스 생성
        img = Image.new("RGB", (width, height), color=(24, 24, 37))
        draw = ImageDraw.Draw(img)

        # 그라데이션 및 박스 효과
        accent_color = (99, 102, 241) # Indigo
        draw.rectangle([20, 20, width - 20, height - 20], outline=accent_color, width=3)
        draw.rectangle([30, 30, width - 30, 90], fill=(36, 39, 58))

        draw.text((45, 45), "LUMINA AI (DEMO MODE)", fill=(255, 255, 255))
        draw.text((45, 110), f"Prompt: {prompt[:80]}...", fill=(200, 200, 220))
        draw.text((45, 150), f"Seed: {seed} | Size: {width}x{height}", fill=(160, 160, 180))
        draw.text((45, 190), f"ComfyUI Status: OFFLINE (127.0.0.1:8188)", fill=(239, 68, 68))
        draw.text((45, 230), "Connect ComfyUI to render real Lumina AI images!", fill=(147, 197, 253))

        img.save(local_path, format="PNG")

        return {
            "id": gen_id,
            "image_url": f"/outputs/{local_filename}",
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "seed": seed,
            "mode": "demo_fallback"
        }
