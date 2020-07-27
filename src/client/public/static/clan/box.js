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
        text_enable: false,
        roles_front: [],
        roles_mid: [],
        roles_back: [],
        img_update: 0,
        roles_img: {},
        roles_show: [],
        roles_add_visibility: false,
        box_data: [],
        id2dis: {},
        id2cnname: {},
        cnname2id: {},
    },
    created() {
        var thisvue = this;
        var selected_roles = thisvue.get_selected_cookie();
        axios.all([
            axios.post('./users/', {
                csrf_token: csrf_token,
            }),
            axios.post('./roles/', {
                csrf_token: csrf_token,
            }),
            axios.post('./roles_name/', {
                csrf_token: csrf_token,
            })
        ]).then(axios.spread((users, roles, roles_name) => {
            if (users.data.code !== 0) {
                thisvue.$alert('获取用户数据失败');
                return;
            }
            if (roles.data.code !== 0) {
                thisvue.$alert('获取角色距离数据失败');
                return;
            }
            if (roles_name.data.code !== 0) {
                thisvue.$alert('获取角色名称数据失败');
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
            thisvue.id2cnname = roles_name.data.id2cnname;
            for (var key in thisvue.id2cnname) {
                thisvue.cnname2id[thisvue.id2cnname[key]] = Number(key);
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
                    if (response.data.boxes[thisvue.box_data[i].qqid] !== undefined) {
                        for (d of response.data.boxes[thisvue.box_data[i].qqid].roles) {
                            thisvue.box_data[i].stars[d.role_id] = d.stars;
                        }
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

        render_header (h, {column, $index}) {
            if (this.text_enable) {
                return h('a', {
                      style: {
                          padding: "0px",
                      },
                      domProps: {
                        innerHTML: `${this.id2cnname[column.label]}`
                      }
                  });
            }
            else {
                return h('a', {
                      style: {
                          padding: "0px",
                      },
                      domProps: {
                        innerHTML: `<img src="${this.roles_img[Number(column.label)]}" alt="${column.label}" width="32" height="32"></img>`
                      }
                  });
            }
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
        sort_stars (a, b, id) {
            const na = a.stars[Number(id)];
            const nb = b.stars[Number(id)];
            return na < nb ? -1 : (na > nb ? 1 : 0);
        },
        export_to_excel () {
            if (!this.text_enable) {
                this.$alert('excel不会加载图片，请切换到文字显示');
                return;
            }
            var icons = document.getElementsByTagName('span');
            while (icons[0]) {
                icons[0].remove();
            }
            var uri = 'data:application/vnd.ms-excel;base64,';
            var ctx =
                '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>' +
                document.getElementsByTagName('thead')[0].innerHTML +
                document.getElementsByTagName('tbody')[0].innerHTML +
                '</table></body></html>';
            window.location.href = uri + window.btoa(unescape(
                encodeURIComponent(ctx)));
            document.documentElement.innerHTML =
                "请在Excel中查看（如果无法打开，请安装最新版本Excel）\n或者将整个表格复制，粘贴到Excel中使用";
        },
        import_from_excel (upload_file) {
            var thisvue = this;
            if (!window.FileReader) {
                this.$alert('浏览器不支持上传文件，请更换浏览器');
                return;
            }
            var fr = new FileReader();
            fr.onload = ev => {
                try {
                    wb = XLSX.read(ev.target.result, {
                                type: 'binary'
                            });
                    sheet = wb.Sheets[wb.SheetNames[0]];
                    json = XLSX.utils.sheet_to_json(sheet)
                    var update_count = 0;
                    for (row of json) {
                        update_count += thisvue.insert_to_box_data(row);
                    }
                    var unidentify_set = new Set();
                    var identify_set = new Set();
                    if (json.length >= 1) {
                        thisvue.roles_show = [];
                        for (var key in json[0]) {
                            if (key != 'QQ号' && key != '昵称') {
                                var id = thisvue.cnname2id[key];
                                if (id == undefined) {
                                    unidentify_set.add(key);
                                } else {
                                    identify_set.add(key);
                                    thisvue.roles_show.push(Number(thisvue.cnname2id[key]));
                                }
                            }
                        }
                    }
                    for (let i = 0; i < thisvue.roles_front.length; i++) {
                        thisvue.roles_front[i].selected = identify_set.has(thisvue.id2cnname[thisvue.roles_front[i].id]);
                    }
                    for (let i = 0; i < thisvue.roles_mid.length; i++) {
                        thisvue.roles_mid[i].selected = identify_set.has(thisvue.id2cnname[thisvue.roles_mid[i].id]);
                    }
                    for (let i = 0; i < thisvue.roles_back.length; i++) {
                        thisvue.roles_back[i].selected = identify_set.has(thisvue.id2cnname[thisvue.roles_back[i].id]);
                    }
                    thisvue.save_selected_cookie(thisvue.roles_show);
                    var msg = `导入成功\n共读取${update_count}人Box\n以下角色已被识别：` + [...identify_set].join('，');
                    if (unidentify_set.size > 0) {
                        msg += '\n以下角色未被识别：' + [...unidentify_set].join('，');
                    }
                    thisvue.$alert(msg);
                } catch (e) {
                    thisvue.$alert('读取文件出现错误：' + e.message);
                    return
                }
            };
            fr.readAsBinaryString(upload_file.file);
        },
        insert_to_box_data (row) {
            for (let i = 0; i < this.box_data.length; ++i) {
                if (this.box_data[i].qqid == row['QQ号']) {
                    for (var key in row) {
                        if (key != 'QQ号' && key != '昵称') {
                            var id = this.cnname2id[key];
                            if (id !== undefined) {
                                this.box_data[i].stars[id] = row[key];
                            }
                        }
                    }
                    return 1;
                }
            }
            return 0;
        }
    },
    delimiters: ['[[', ']]'],
})
