if (!Object.defineProperty) {
    alert('浏览器版本过低');
}
var vm = new Vue({
    el: '#app',
    data: {
        stars: [{label: '0', value: 0},
            {label: '1', value: 1},
            {label: '2', value: 2},
            {label: '3', value: 3},
            {label: '4', value: 4},
            {label: '5', value: 5},
            {label: '6', value: 6},],
        edit_enable: false,
        roles_front: [],
        roles_mid: [],
        roles_back: [],
        img_update: 0,
        roles_img: {},
        roles_show: [],
        roles_add_visibility: false,
        box_data: [],
        id2dis: {},
    },
    created() {
        var thisvue = this;
        var selected_roles = thisvue.get_selected_cookie();
        axios.all([
            axios.post('./users/', {
                csrf_token: csrf_token,
            }),
            axios.post('./roles/', {
                csrf_token: csrf_token
            })
        ]).then(axios.spread((users, roles) => {
            if (users.data.code !== 0) {
                thisvue.$alert('获取用户数据失败');
                return;
            }
            if (roles.data.code !== 0) {
                thisvue.$alert('获取角色数据失败');
                return;
            }
            for (u of users.data.users) {
                thisvue.box_data.push({
                    qqid: u.qqid,
                    nickname: u.nickname,
                    stars: {},
                });
            }
            thisvue.roles_front = roles.data.front;
            thisvue.roles_mid = roles.data.mid;
            thisvue.roles_back = roles.data.back;
            for (let i = 0; i < thisvue.roles_front.length; i++) {
                thisvue.roles_front[i].selected = selected_roles.has(Number(thisvue.roles_front[i].id));
                getImg(thisvue.roles_front[i].id + '31', function (b64text, key) {
                    if (b64text !== undefined) {
                        var id = key.slice(0, 4);
                        thisvue.roles_front[i].img = 'data:image/png;base64,' + b64text;
                        thisvue.roles_img[id] = thisvue.roles_front[i].img;
                        thisvue.img_update++;
                    }
                });
            }
            for (let i = 0; i < thisvue.roles_mid.length; i++) {
                thisvue.roles_mid[i].selected = selected_roles.has(Number(thisvue.roles_mid[i].id));
                getImg(thisvue.roles_mid[i].id + '31', function (b64text, key) {
                    if (b64text !== undefined) {
                        var id = key.slice(0, 4);
                        thisvue.roles_mid[i].img = 'data:image/png;base64,' + b64text;
                        thisvue.roles_img[id] = thisvue.roles_mid[i].img;
                        thisvue.img_update++;
                    }
                });
            }
            for (let i = 0; i < thisvue.roles_back.length; i++) {
                thisvue.roles_back[i].selected = selected_roles.has(Number(thisvue.roles_back[i].id));
                getImg(thisvue.roles_back[i].id + '31', function (b64text, key) {
                    if (b64text !== undefined) {
                        var id = key.slice(0, 4);
                        thisvue.roles_back[i].img = 'data:image/png;base64,' + b64text;
                        thisvue.roles_img[id] = thisvue.roles_back[i].img;
                        thisvue.img_update++;
                    }
                });
            }
        }))
    },
    mounted() {
        
    },
    methods: {
        click_front (img_id) {
            var thisvue = this;
            for (let i = 0; i < thisvue.roles_front.length; i++) {
                if (thisvue.roles_front[i].id === img_id) {
                    thisvue.roles_front[i].selected = !thisvue.roles_front[i].selected;
                    thisvue.img_update++;
                }
            }
        },
        click_mid (img_id) {
            var thisvue = this;
            for (let i = 0; i < thisvue.roles_mid.length; i++) {
                if (thisvue.roles_mid[i].id === img_id) {
                    thisvue.roles_mid[i].selected = !thisvue.roles_mid[i].selected;
                    thisvue.img_update++;
                }
            }
        },
        click_back (img_id) {
            var thisvue = this;
            for (let i = 0; i < thisvue.roles_back.length; i++) {
                if (thisvue.roles_back[i].id === img_id) {
                    thisvue.roles_back[i].selected = !thisvue.roles_back[i].selected;
                    thisvue.img_update++;
                }
            }
        },
        update_roles () {
            var thisvue = this;
            thisvue.roles_show = [];
            for (let i = 0; i < thisvue.roles_front.length; i++) {
                if (thisvue.roles_front[i].selected) {
                    thisvue.roles_show.push(thisvue.roles_front[i].id);
                }
            }
            for (let i = 0; i < thisvue.roles_mid.length; i++) {
                if (thisvue.roles_mid[i].selected) {
                    thisvue.roles_show.push(thisvue.roles_mid[i].id);
                }
            }
            for (let i = 0; i < thisvue.roles_back.length; i++) {
                if (thisvue.roles_back[i].selected) {
                    thisvue.roles_show.push(thisvue.roles_back[i].id);
                }
            }
            for (let i = 0; i < thisvue.box_data.length; i++) {
                for (id of thisvue.roles_show) {
                    thisvue.box_data[i].stars[id] = 0;
                }
            }
            thisvue.save_selected_cookie(thisvue.roles_show);
            thisvue.request_roles();
        },
        request_roles () {
            var thisvue = this;
            axios.post(
                './api/', {
                    csrf_token: csrf_token,
                    data: thisvue.roles_show,
                }
            ).then(response => {
                if (response.data.code !== 0) {
                    thisvue.$alert('获取服务器Box错误，错误消息：' + response.data.message);
                    return;
                }
                for (let i = 0; i < thisvue.box_data.length; i++) {
                    for (d of response.data.boxes[thisvue.box_data[i].qqid].roles) {
                        thisvue.box_data[i].stars[d.role_id] = d.stars;
                    }
                }
                thisvue.$forceUpdate();
            });
        },
        submit_update() {
            var thisvue = this;

            var submit = [];
            for (let i = 0; i < thisvue.box_data.length; i++) {
                var stars = {};
                for (id of thisvue.roles_show) {
                    stars[id] = thisvue.box_data[i].stars[id];
                }
                submit.push({
                    qqid: thisvue.box_data[i].qqid,
                    stars: stars,
                });
            }
            console.log(submit);
            axios.post('./update/', {
                csrf_token: csrf_token,
                data: submit,
            }).then(response => {
                if (response.data.code !== 0) {
                    thisvue.$alert('更新错误，错误消息：' + response.data.message);
                    return;
                }
                thisvue.$alert('更新成功：' + response.data.message);
            });
        },

        render_img (h, {column, $index}) {
            return h('a', {
                  style: {
                      padding: "0px",
                  },
                  domProps: {
                    innerHTML: `<img src="${this.roles_img[Number(column.label)]}" alt="${column.label}" width="32" height="32"></img>`
                  }
              });
        },
        get_selected_cookie () {
            var cookies = document.cookie.split(';');
            var st = new Set();
            for (let i = 0; i < cookies.length; i++) {
                var s = cookies[i].trim();
                if (s.indexOf('box_selected') == 0) {
                    var value_str = s.substring(13, s.length);
                    var values = value_str.split('-');
                    for (value of values) {
                        st.add(Number(value));
                    }
                }
            }
            return st;
        },
        save_selected_cookie (roles_selected) {
            value = roles_selected.join('-');
            document.cookie = "box_selected=" + value;
        },
    },
    delimiters: ['[[', ']]'],
})
