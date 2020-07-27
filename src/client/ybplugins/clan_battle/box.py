from typing import Dict, Any
from quart import Quart, jsonify, session, request
from urllib.parse import urljoin
from ..ybdata import Clan_group, User, User_box, Clan_member
from ..hook import Hook
import os
import base64
import json
import logging

logger = logging.getLogger(__name__)

class ClanBox:
    Passive = False
    Active = False
    Request = True

    def __init__(self,
                glo_setting: Dict[str, Any],
                *args, **kwargs):
        self.setting = glo_setting


    def register_routes(self, app: Quart):
        @app.route(urljoin(self.setting['public_basepath'],
                'clan/<int:group_id>/box/update/'), methods=['POST'])
        async def update_box(group_id):
            return await self.__accessibility_check(group_id) or await self.__update_box(group_id)

        @app.route(urljoin(self.setting['public_basepath'],
                'clan/<int:group_id>/box/api/'), methods=['POST'])
        async def send_box(group_id):
            return await self.__accessibility_check(group_id) or await self.__send_box(group_id)

        @app.route(urljoin(self.setting['public_basepath'],
                'clan/<int:group_id>/box/roles/'), methods=['POST'])
        async def send_roles(group_id):
            return await self.__accessibility_check(group_id) or await self.__send_roles(group_id)

        @app.route(urljoin(self.setting['public_basepath'],
                'clan/<int:group_id>/box/users/'), methods=['POST'])
        async def send_users(group_id):
            return await self.__accessibility_check(group_id) or await self.__send_users(group_id)

        @app.route(urljoin(self.setting['public_basepath'],
                'clan/<int:group_id>/box/roles_name/'), methods=['POST'])
        async def send_roles_name(group_id):
            return await self.__accessibility_check(group_id) or await self.__send_roles_name(group_id)

    async def __send_box(self, group_id):
        user_id = session['yobot_user']
        user = User.get_by_id(user_id)
        group = Clan_group.get_or_none(group_id=group_id)
        boxes = {}
        d = json.loads(await request.get_data())['data']
        roles_set = set(d)
        for item in User_box.select().where(
            User_box.gid == group_id,
        ):
            if item.qqid not in boxes.keys():
                boxes[item.qqid] = {'roles': []}
            if item.chid in roles_set:
                boxes[item.qqid]['roles'].append({
                    'role_id': item.chid,
                    'stars': item.stars,
                    'rank': item.rank,
                })
        return jsonify(code=0, boxes=boxes)

    async def __send_roles(self, group_id):
        id2dis = Hook.get('get_id2dis')()
        front = []
        mid = []
        back = []
        for _id, dis in id2dis.items():
            if dis < 300:
                front.append({'id': _id})
            elif dis > 600:
                back.append({'id': _id})
            else:
                mid.append({'id': _id})
        front.sort(key=lambda x: id2dis[x['id']])
        mid.sort(key=lambda x: id2dis[x['id']])
        back.sort(key=lambda x: id2dis[x['id']])
        return jsonify(code=0, front=front, mid=mid, back=back)

    async def __send_roles_name(self, group_id):
        id2cnname = Hook.get('get_id2cnname')()
        return jsonify(code=0, id2cnname=id2cnname)

    async def __send_users(self, group_id):
        users = []
        for item in Clan_member.select(
            Clan_member.qqid,
            User.nickname,
        ).join(
            User,
            on=(Clan_member.qqid == User.qqid),
            attr='user',
        ).where(
            Clan_member.group_id == group_id
        ).distinct():
            users.append({'qqid': item.qqid, 'nickname': item.user.nickname})
        return jsonify(code=0, users=users)


    async def __update_box(self, group_id):
        user_id = session['yobot_user']
        user = User.get_by_id(user_id)
        d = json.loads(await request.get_data())['data']

        if user.authority_group >= 100:
            message = '更新了本人的box，'
            admin = False
        else:
            message = '更新了所有人的box，'
            admin = True
        update_count = 0
        for user_item in d:
            qqid, stars = user_item['qqid'], user_item['stars']
            if not admin and qqid != user_id:
                continue
            for roles_id, star in stars.items():
                conditions = [User_box.qqid == qqid, User_box.chid==roles_id]
                pre_box = User_box.select(User_box).where(*conditions)
                if len(pre_box):
                    User_box.update(
                        gid=group_id,
                        stars=star,
                        equit=False,
                    ).where(*conditions).execute()
                    update_count += 1
                else:
                    User_box.create(
                        qqid=qqid,
                        gid=group_id,
                        chid=roles_id,
                        stars=star,
                        equit=False,
                    )
                    update_count += 1

        message += f'共更新了{update_count}条。'
        return jsonify(code=0, message=message)

    async def __accessibility_check(self, group_id):
        if 'yobot_user' not in session:
            return jsonify(
                code=10,
                message='Not logged in',
            )
        user_id = session['yobot_user']
        user = User.get_by_id(user_id)
        group = Clan_group.get_or_none(group_id=group_id)
        if group is None:
            return jsonify(
                code=20,
                message='Group not exists',
            )
        is_member = Clan_member.get_or_none(
            group_id=group_id, qqid=session['yobot_user'])
        if not is_member:
            return jsonify(
                code=11,
                message='Insufficient authority',
            )
        try:
            payload = await request.get_json()
            if payload is None:
                return jsonify(
                    code=30,
                    message='Invalid payload',
                )
            if payload.get('csrf_token') != session['csrf_token']:
                return jsonify(
                    code=15,
                    message='Invalid csrf_token',
                )
        except KeyError as e:
            _logger.error(e)
            return jsonify(code=31, message='missing key: '+str(e))
        except Exception as e:
            _logger.exception(e)
            return jsonify(code=40, message='server error')

    def execute(self, *args, **kwargs):
        pass

    async def execute_async(self, *args, **kwargs):
        pass
