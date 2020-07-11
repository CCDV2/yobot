from typing import Dict, Any
from quart import Quart, jsonify
from urllib.parse import urljoin
import os
import base64

class ImgSender:
    Passive = True
    Active = False
    Request = True

    def __init__(self,
                glo_setting: Dict[str, Any],
                *args, **kwargs):
        self.setting = glo_setting
        self.img_version = glo_setting.get('img_version', 1)

    def register_routes(self, app: Quart):

        @app.route(urljoin(
            self.setting['public_basepath'], 'img/imgs'),
            methods=['POST'])
        async def send_imgs():
            response = []
            for root, dirs, files in os.walk('./public/img_cls'):
                for dir in dirs:
                    for r2, d2, f2 in os.walk(os.path.join(root, dir)):
                        for f in f2:
                            with open(os.path.join(root, dir, f), 'rb') as img:
                                img_str = base64.b64encode(img.read()).decode('ascii')
                            response.append({'id': f'{dir}{f.split(".")[0]}1', 'img': img_str})
            return jsonify(code=0, data=response)

        @app.route(urljoin(
            self.setting['public_basepath'], 'img/<int:img_id>'),
            methods=['POST'])
        async def send_img(img_id):
            try:
                img_id = str(img_id)
                response = []
                img_path = os.path.join('./public/img_cls', img_id[:4], img_id[4] + '.png')
                if os.path.exists(img_path):
                    with open(img_path, 'rb') as img:
                        img_str = base64.b64encode(img.read()).decode('ascii')
                    response.append({'id': f'{img_id[:5]}1', 'img': img_str})
                    return jsonify(code=0, data=response)
                else:
                    return jsonify(code=404, message='未找到对应图片')
            except Exception as e:
                return jsonify(code=404, message=str(e))

        @app.route(urljoin(self.setting['public_basepath'], 'img/version'), methods=['GET'])
        async def send_img_version():
            return jsonify(code=0, data=self.img_version)

    def execute(self, *args, **kwargs):
        pass

    async def execute_async(self, *args, **kwargs):
        pass

if __name__ == '__main__':
    pass
