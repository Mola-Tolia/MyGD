window.addEventListener('DOMContentLoaded',async () => {
    const DEACTIVATION_TIME = 300000
    const TOOLBAR_AUTO_RETRACT_TIME = 5000
    let setting_wallpaper = false
    document.querySelector('.retract').addEventListener('click',() => {
        window.pre_api.show()
        root.style.setProperty("--wp_display", 'none')
        if(setting_wallpaper) main.classList.remove('main_blur')
        setting_wallpaper = false
    })
    const main = document.querySelector('#main')
    const root = document.querySelector(':root')
    const {width,height} = main.getClientRects()[0]
    const main_style = window.getComputedStyle(main, null)
    const main_pl = parseFloat(main_style.getPropertyValue('padding-left'))
    const main_pr = parseFloat(main_style.getPropertyValue('padding-right'))
    const main_pt = parseFloat(main_style.getPropertyValue('padding-top'))
    const main_pb = parseFloat(main_style.getPropertyValue('padding-bottom'))
    const real_width = width - main_pl - main_pr
    const real_height = height - main_pt - main_pb
    const card_width = new Array(61).fill(300).map((num,index) => num - index).reduce((pre,cur,index) => {
        if(Math.floor(real_width / cur) > Math.floor(real_width / pre)) return cur
        return pre
    },300)
    const card_height = new Array(101).fill(400).map((num,index) => num - index).reduce((pre,cur,index) => {
        if(Math.floor(real_height / cur) > Math.floor(real_height / pre)) return cur
        return pre
    },400)
    const file_margin_left = (card_width % 80) / (Math.floor(card_width / 80) + 1)
    root.style.setProperty("--card_width", `${card_width}px`)
    root.style.setProperty("--card_height", `${card_height}px`)
    root.style.setProperty("--file_margin_left", `${file_margin_left}px`)
    let cards_mark = new Array(Math.floor(real_width / card_width) * Math.floor(real_height / card_height)).fill('').map((i,mark) => {
        const card = document.createElement('div')
        card.className = 'card'
        card.setAttribute('mark',mark)
        main.insertAdjacentElement('beforeend',card)
        card.addEventListener('dragenter',(e) => {
            e.preventDefault()
        })
        card.addEventListener('dragover',(e) => {
            e.preventDefault()
            card.classList.add('card_drag')
        })
        card.addEventListener('dragleave',(e) => {
            e.preventDefault()
            card.classList.remove('card_drag')
        })
        card.addEventListener('drop',async (e) => {
            e.preventDefault()
            card.classList.remove('card_drag')
            let file = e.dataTransfer.files[0]
            if(file.path === '' || !file) return
            let info = {}
            if(await window.pre_api.judgeDorF(file.path)){
                info = {
                    name:file.name,
                    path:file.path,
                    type:'dir',
                }
            }else{
                let res = await file.arrayBuffer()
                info = {
                    name:file.name,
                    path:file.path,
                    type:file.type,
                    arrayBuffer:res
                }
            }
            info.mark = mark
            let file_data = await window.pre_api.uploadFile(info)
            addFileControl(card,file_data)
        })
        return mark
    })
    window.pre_api.init_cards(cards_mark).then(cards_data => {
        //将每张卡片的文件信息呈现到卡片中
        cards_data.forEach((files,index) => {
            const card = Array.from(document.querySelectorAll('.card')).find(card => card.getAttribute('mark') == index)
            files.forEach(file => {
                addFileControl(card,file)
            })
        })
    })
    let retractToolBarTime = null
    const toolbarIcon = document.querySelector('.toolbarIcon'),
    toolbar = document.querySelector('.toolbar')
    const mouseenter_toolbar = () => {
        clearTimeout(retractToolBarTime)
    }
    const mouseleave_toolbar = () => {
        retractToolBarTime = setTimeout(() => {
            toolbarIcon.click()
        },TOOLBAR_AUTO_RETRACT_TIME)
    }
    const main_click = (e) => {
        if(e.target === toolbarIcon) return
        toolbarIcon.click()
        clearTimeout(retractToolBarTime)
    }
    toolbarIcon.addEventListener('click',() => {
        if(root.style.getPropertyValue('--toolbar-ty') === '0'){
            toolbar.removeEventListener('mouseleave',mouseleave_toolbar)
            toolbar.removeEventListener('mouseenter',mouseenter_toolbar)
            main.removeEventListener('click',main_click)
            root.style.setProperty('--toolbar-ty','-100%')
            setTimeout(() => {root.style.setProperty('--toolbarIcon-display','block')},500)
        }else{
            root.style.setProperty('--toolbar-ty','0')
            root.style.setProperty('--toolbarIcon-display','none')
            toolbar.addEventListener('mouseleave',mouseleave_toolbar)
            toolbar.addEventListener('mouseenter',mouseenter_toolbar)
            main.addEventListener('click',main_click)
        }
    })
    document.querySelector('.divide_rough').addEventListener('click',() => {
        window.pre_api.divideRough().then(files_info => {
            if(files_info.length == 0) return
            const marks = []
            files_info.forEach(file => !marks.includes(file[0]) && marks.push(file[0]))
            Array.from(document.querySelectorAll('.card')).filter(card => marks.includes(card.getAttribute('mark'))).forEach(card => {
                Array.from(card.querySelectorAll('.file')).forEach(file => file.parentNode.removeChild(file))
            })
            files_info.filter(file => file.length > 1).forEach(([mark,file_info]) => {
                addFileControl(Array.from(document.querySelectorAll('.card')).find(card => card.getAttribute('mark') == mark),file_info)
            })
        })
    })
    document.querySelector('.divide_detailed').addEventListener('click',() => {
        window.pre_api.divideDetailed().then(files_info => {
            Array.from(document.querySelectorAll('.card')).forEach(card => {
                Array.from(card.querySelectorAll('.file')).forEach(file => file.parentNode.removeChild(file))
            })
            files_info.forEach(([mark,file_info]) => {
                addFileControl(Array.from(document.querySelectorAll('.card')).find(card => card.getAttribute('mark') == mark),file_info)
            })
        })
    })
    document.querySelector('.wallpaper_btn').addEventListener('click',() => {
        setting_wallpaper = true
        root.style.setProperty("--wp_display", 'flex')
        main.classList.add('main_blur')
        window.pre_api.init_display_images().then(images => {
            Array.from(document.querySelectorAll('.wp_choice_box_item')).forEach(d => {
                d.parentNode.removeChild(d)
            })
            images.forEach(image => {
                addImageControl(image)
            })
        })
    })
    document.querySelector('.order').addEventListener('click',() => {
        main.classList.add('main_blur')
        root.style.setProperty("--order_display", 'flex')
        window.pre_api.getOrders().then(orders => {
            document.querySelector('.op_body').innerHTML = ''
            orders.forEach(order => {
                createOrder(order)
            })
        })
    })
    document.querySelector('.sync').addEventListener('click',async () => {
        main.classList.add('main_blur')
        root.style.setProperty("--sync-display", 'flex')
        const sync_box = document.querySelector('.sync_box')
        sync_box.innerHTML = ''
        const hasSyncFiles = await window.pre_api.getSyncFiles()
        window.pre_api.getAllFiles().then(area_files => {
            area_files.forEach(area => {
                const sync_area_box = document.createElement('div')
                sync_area_box.classList.add('sync_area_box')
                area.forEach(file => {
                    const sync_area_box_file_check = document.createElement('input')
                    sync_area_box_file_check.classList.add('sync_area_box_file_check')
                    sync_area_box_file_check.type = 'checkbox'
                    sync_area_box_file_check.checked = hasSyncFiles.find(has_file => has_file.file_path == file.file_path) ? true : false
                    sync_area_box_file_check.id = file.file_id
                    const sync_area_box_file = document.createElement('label')
                    sync_area_box_file.setAttribute('for',file.file_id)
                    const sync_area_box_file_icon = document.createElement('img')
                    const sync_area_box_file_text = document.createElement('div')
                    sync_area_box_file.classList.add('sync_area_box_file')
                    sync_area_box_file_icon.classList.add('sync_area_box_file_icon')
                    sync_area_box_file_text.classList.add('sync_area_box_file_text')
                    sync_area_box_file.setAttribute('file_path',file.file_path)
                    sync_area_box_file_icon.src = file.icon_path
                    sync_area_box_file_text.innerText = file.name
                    sync_area_box_file.insertAdjacentElement('beforeend',sync_area_box_file_icon)
                    sync_area_box_file.insertAdjacentElement('beforeend',sync_area_box_file_text)
                    sync_area_box.insertAdjacentElement('beforeend',sync_area_box_file_check)
                    sync_area_box.insertAdjacentElement('beforeend',sync_area_box_file)
                })
                sync_box.insertAdjacentElement('beforeend',sync_area_box)
            })
        })
    })
    document.querySelector('.close_sync_box').addEventListener('click',() => {
        main.classList.remove('main_blur')
        root.style.setProperty("--sync-display", 'none')
    })
    document.querySelector('.release_all').addEventListener('click',() => {
        window.pre_api.releaseAll().then(ids => {
            Array.from(document.querySelectorAll('.card')).forEach(card => {
                Array.from(card.querySelectorAll('.file')).forEach(file => {
                    if(ids.includes(Number(file.getAttribute('file_id')))) return
                    file.parentNode.removeChild(file)
                })
            })
        })
    })
    main.addEventListener('mouseenter',main_mouseenter)
    main.addEventListener('mouseleave',main_mouseleave)
    let deactivationTimer = null
    function main_mouseenter(){
        deactivationTimer && clearTimeout(deactivationTimer)
    }
    async function main_mouseleave(){
        if(await window.pre_api.isRetract()) return
        deactivationTimer = setTimeout(() => {
            document.querySelector('.retract').click()
        },DEACTIVATION_TIME)
    }
    Array.from(document.querySelectorAll('.wp_mode')).forEach(mode => {
        mode.addEventListener('click',() => {
            let index = Array.from(document.querySelectorAll('.wp_mode')).indexOf(mode)
            root.style.setProperty("--wp-mode_box", `${5 + 50 * index}px`)
            root.style.setProperty("--wp-mode_inbox", `${-5 - 50 * index}px`)
        })
    })
    window.pre_api.getWindowAspectRatio().then(asp => {
        root.style.setProperty("--wp-display_asp", asp)
    })
    document.querySelector('.scrollToLeft').addEventListener('click',() => {
        document.querySelector('.wp_choice_box').scrollBy({behavior:'smooth',left:-300})
    })
    document.querySelector('.scrollToRight').addEventListener('click',() => {
        document.querySelector('.wp_choice_box').scrollBy({behavior:'smooth',left:300})
    })
    document.querySelector('.wp_upload').addEventListener('click',() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = function(event){
            const file = event.target.files[0]
            if(!file.type.includes('image')) {
                alert('请上传图片文件！')
                return
            }
            window.pre_api.uploadImage(file.path).then(image => {
                addImageControl(image)
            })
        }
        input.click()
    })
    window.pre_api.init_display_images().then(images => {
        Array.from(document.querySelectorAll('.wp_choice_box_item')).forEach(d => {
            d.parentNode.removeChild(d)
        })
        images.forEach(image => {
            addImageControl(image)
        })
    })
    getWindowCurrentWallpaper()
    Array.from(document.querySelectorAll('.wp_mode')).forEach(wp_mode => {
        switch(wp_mode.getAttribute('mode')){
            case '1'://适应
                wp_mode.addEventListener('click',() => {
                    root.style.setProperty("--wp-mode_object-fit", 'contain')
                    root.style.setProperty("--wp-m5_display", 'none')
                })
                break
            case '2'://填充
                wp_mode.addEventListener('click',() => {
                    root.style.setProperty("--wp-mode_object-fit", 'cover')
                    root.style.setProperty("--wp-m5_display", 'none')
                })
                break
            case '3'://拉伸
                wp_mode.addEventListener('click',() => {
                    root.style.setProperty("--wp-mode_object-fit", 'fill')
                    root.style.setProperty("--wp-m5_display", 'none')
                })
                break
            case '4'://居中
                wp_mode.addEventListener('click',() => {
                    root.style.setProperty("--wp-mode_object-fit", 'scale-down')
                    root.style.setProperty("--wp-m5_display", 'none')
                })
                break
            case '5'://平铺
                wp_mode.addEventListener('click',() => {
                    root.style.setProperty("--wp-m5_display", 'block')
                })
        }
    })
    document.querySelector('.wp_save').addEventListener('click',() => {
        let image_src = document.querySelector('.wp_display_cur_img').src
        let object_fit = root.style.getPropertyValue("--wp-mode_object-fit")
        let display = root.style.getPropertyValue("--wp-m5_display")
        let mode = 1
        if(display == 'block'){
            mode = 5
        }else{
            switch(object_fit){
                case 'contain':
                    mode = 1
                    break
                case 'cover':
                    mode = 2
                    break
                case 'fill':
                    mode = 3
                    break
                case 'scale-down':
                    mode = 4
            }
        }
        window.pre_api.settingWallpaper(image_src,mode)
    })
    document.querySelector('.wp_back').addEventListener('click',() => {
        root.style.setProperty("--wp_display", 'none')
        main.classList.remove('main_blur')
        setting_wallpaper = false
    })
    document.querySelector('.op_back').addEventListener('click',() => {
        main.classList.remove('main_blur')
        root.style.setProperty("--order_display", 'none')
    })
    let op_body_width = document.querySelector('.op_body').getClientRects()[0].width
    const item_width = document.querySelector('.op_body').children[0].getClientRects()[0].width
    root.style.setProperty("--order_item-margin_lar", `${Math.floor((op_body_width % item_width) / Math.floor(op_body_width / item_width) / 2)}px`)
    const order_item_template = document.querySelector('.order_item_template')
    order_item_template.parentNode.removeChild(order_item_template)
    const labels = document.querySelector('.opc_order_remind_times_control').querySelectorAll('label')
    Array.from(labels).forEach(label => {
        label.addEventListener('click',() => {
            root.style.setProperty('--basic_scale2',Array.from(labels).indexOf(label) * 0.1)
        })
    })
    document.querySelector('.opc_control_uploadFile').addEventListener('click',() => {
        document.querySelector('.opc_choose_file').classList.add('opc_choose_file_show')
        window.pre_api.getAllFiles().then(area_files => {
            document.querySelector('.opc_choose_file_area_box').innerHTML = ''
            area_files.forEach(files => {
                const opc_choose_file_area = document.createElement('div')
                opc_choose_file_area.classList.add('opc_choose_file_area')
                files.forEach(file => {
                    const opc_choose_file_area_file = document.createElement('div')
                    opc_choose_file_area_file.classList.add('opc_choose_file_area_file')
                    opc_choose_file_area.insertAdjacentElement('beforeend',opc_choose_file_area_file)
                    const opc_choose_file_area_file_icon = document.createElement('img')
                    const opc_choose_file_area_file_name = document.createElement('p')
                    opc_choose_file_area_file_icon.classList.add('opc_choose_file_area_file_icon')
                    opc_choose_file_area_file_name.classList.add('opc_choose_file_area_file_name')
                    opc_choose_file_area_file_icon.src = file.icon_path
                    opc_choose_file_area_file_name.innerText = file.name
                    opc_choose_file_area_file.insertAdjacentElement('beforeend',opc_choose_file_area_file_icon)
                    opc_choose_file_area_file.insertAdjacentElement('beforeend',opc_choose_file_area_file_name)
                    opc_choose_file_area_file.setAttribute('file_id',file.file_id)
                    opc_choose_file_area_file.setAttribute('file_path',file.file_path)
                    opc_choose_file_area_file.addEventListener('click',() => {
                        const file = {
                            file_id:opc_choose_file_area_file.getAttribute('file_id'),
                            file_path:opc_choose_file_area_file.getAttribute('file_path'),
                            icon_path:opc_choose_file_area_file_icon.src,
                            name:opc_choose_file_area_file_name.innerText
                        }
                        document.querySelector('.opc_choose_file_retract').click()
                        addOrderFile(file)
                    })
                })
                document.querySelector('.opc_choose_file_area_box').insertAdjacentElement('beforeend',opc_choose_file_area)
            })
        })
    })
    document.querySelector('.opc_choose_file_retract').addEventListener('click',() => {
        document.querySelector('.opc_choose_file').classList.remove('opc_choose_file_show')
    })
    document.querySelector('.add_opc_file_remind_custom').addEventListener('click',addCustomTime)
    calOrderDeadline()
    setOrderRemindTimes()
    let opc_title_text = document.querySelector('.opc_title_text')
    let opc_detail_text = document.querySelector('.opc_detail_text')
    opc_title_text.addEventListener('click',windowFocusable)
    opc_title_text.addEventListener('blur',windowUnfocusable)
    opc_detail_text.addEventListener('click',windowFocusable)
    opc_detail_text.addEventListener('blur',windowUnfocusable)
    document.querySelector('.opc_title_text').addEventListener('input',() => {
        title_has_been_edited_by_user = true
    })
    document.querySelector('.opc_detail_text').addEventListener('input',() => {
        detail_has_been_edited_by_user = true
    })
    document.querySelector('.opc_control_cancel').addEventListener('click',() => {
        root.style.setProperty("--op_create-display", 'none')
        document.querySelector('.op_main').classList.remove('op_main_blur')
    })
    document.querySelector('.op_create').addEventListener('click',() => {
        root.style.setProperty("--op_create-display", 'block')
        document.querySelector('.op_main').classList.add('op_main_blur')
        isUpdateOrder = false
        clearCreatingOrderInfo()
    })
    document.querySelector('.opc_control_create').addEventListener('click',() => {
        const order_info = getCreatingOrderInfo()
        title_has_been_edited_by_user = false
        detail_has_been_edited_by_user = false
        let tip = ''
        if(order_info.title.trim() === '') tip = '请写入任务标题'
        if(order_info.detail.trim() === '') tip = tip + (tip.length ? '和任务描述' : '请写入任务标题')
        if(tip.length){
            alert(tip)
            return
        }

        let date = order_info.deadline.slice(0,3).join('/')
        let time = order_info.deadline.slice(3,6).join(':')
        const order_deadline = new Date(`${date} ${time}`).getTime()
        const order_deadline_day = new Date(date).getTime()
        if(order_deadline - new Date().getTime() < 300000){
            alert('任务截止时间应当在当前时间的5分钟之后！')
            return
        }
        if(order_info.files.length){
            if(!order_info.files.every(file => {
                let date = file.deadline.join('/')
                const file_deadline = new Date(date).getTime()
                return file_deadline <= order_deadline_day
            })){
                alert('任务文件中存在截止时间在任务截止时间之后的文件！')
                return
            }
        }
        clearCreatingOrderInfo()
        document.querySelector('.opc_control_cancel').click()
        window.pre_api.createOrder(order_info,updateOrderId).then(orders => {
            document.querySelector('.op_body').innerHTML = ''
            orders.forEach(order => {
                createOrder(order)
            })
        })
        updateOrderId = undefined
        document.querySelector('.opc_control_cancel').classList.remove('cancel_disappear')
        document.querySelector('.opc_control_create').innerText = '创建'
    })
    document.querySelector('.op_back').click()
    document.querySelector('.confirm_sync_box').addEventListener('click',() => {
        const inputs = Array.from(document.querySelectorAll('.sync_area_box_file_check')).filter(input => input.checked)
        const files = inputs.map(input => {
            const label = input.nextElementSibling
            return {
                file_path:label.getAttribute('file_path'),
                name:label.querySelector('.sync_area_box_file_text').innerText,
                icon_path:label.querySelector('.sync_area_box_file_icon').src
            }
        })
        window.pre_api.addSyncFiles(files)
        document.querySelector('.close_sync_box').click()
    })
    document.querySelector('.downSync').addEventListener('click',() => {
        main.classList.add('main_blur')
        root.style.setProperty("--downSync_box-display", 'flex')
        const downSync_inbox = document.querySelector('.downSync_inbox')
        downSync_inbox.innerHTML = ''
        window.pre_api.getRemoteSyncFiles().then(remoteFiles => {
            remoteFiles.forEach(file => {
                const input = document.createElement('input')
                input.classList.add('downSync_file_check')
                input.type = 'checkbox'
                input.id = file.name
                const label = document.createElement('label')
                label.classList.add('downSync_file')
                label.setAttribute('for',file.name)
                const img = document.createElement('img')
                img.classList.add('downSync_file_icon')
                img.src = file.icon_path
                const div = document.createElement('div')
                div.classList.add('downSync_file_text')
                div.innerText = file.name
                label.insertAdjacentElement('beforeend',img)
                label.insertAdjacentElement('beforeend',div)
                downSync_inbox.insertAdjacentElement('beforeend',input)
                downSync_inbox.insertAdjacentElement('beforeend',label)
            })
        })
    })
    document.querySelector('.downSync_box_cancel').addEventListener('click',() => {
        main.classList.remove('main_blur')
        root.style.setProperty("--downSync_box-display", 'none')
    })
    document.querySelector('.downSync_box_download').addEventListener('click',() => {
        const downSync_inbox = document.querySelector('.downSync_inbox')
        const selected_files = []
        Array.from(downSync_inbox.querySelectorAll('.downSync_file_check')).filter(input => input.checked).forEach(input => {
            selected_files.push(input.id)
        })
        window.pre_api.downLoadRemoteSyncFiles(selected_files)
        document.querySelector('.downSync_box_cancel').click()
    })

    document.addEventListener('click',() => {
        window.pre_api.test().then(res => {
            // alert(`结果***${Array.isArray(res)}***${res.length}***${typeof res}***${123}`)
        })
    })
    // document.querySelector('.retract').click()
})

function addFileControl(card,data){
    let file = document.createElement('div')
    file.className = 'file'
    file.setAttribute('file_id',data.file_id)
    let img = document.createElement('img')
    img.className = 'fileIcon'
    img.draggable = false
    img.src = data.isDir ? './resources/images/directory.png' : data.icon
    let span = document.createElement('span')
    span.className = 'fileName'
    span.innerText = data.name
    let close = document.createElement('div')
    close.className = 'release'
    file.insertAdjacentElement('beforeend',img)
    file.insertAdjacentElement('beforeend',span)
    file.insertAdjacentElement('beforeend',close)
    card.insertAdjacentElement('beforeend',file)
    close.addEventListener('click',() => {
        window.pre_api.releaseFile(data.file_id,file.parentNode.getAttribute('mark'))
        file.parentNode.removeChild(file)
    })
    file.addEventListener('mousedown',() => {
        const main = document.querySelector('#main')
        file.addEventListener('mousemove',file_mousemove)
        file.addEventListener('mouseup',file_mouseup)
        let image_followMouse
        function file_mousemove(event){
            file.removeEventListener('mouseup',file_mouseup)
            file.removeEventListener('mousemove',file_mousemove)
            image_followMouse = document.createElement('img')
            image_followMouse.className = 'image_followMouse'
            image_followMouse.src = img.src
            main.insertAdjacentElement('beforeend',image_followMouse)
            main.addEventListener('mousemove',main_mousemove)
            main.addEventListener('mouseup',main_mouseup)
        }
        function main_mousemove(event){
            const {clientX:mouse_X,clientY:mouse_Y} = event
            document.querySelector(':root').style.setProperty('--image_followMouse-left',`${mouse_X - 20}px`)
            document.querySelector(':root').style.setProperty('--image_followMouse-top',`${mouse_Y - 20}px`)
        }
        function main_mouseup(event){
            main.removeEventListener('mousemove',main_mousemove)
            main.removeEventListener('mouseup',main_mouseup)
            image_followMouse.parentNode.removeChild(image_followMouse)
            const target_card = findCard(event.target)
            const origin_mark = file.parentNode.getAttribute('mark')
            const target_mark = target_card.getAttribute('mark')
            if(target_card && origin_mark != target_mark){
                file.parentNode.removeChild(file)
                target_card.insertAdjacentElement('beforeend',file)
                window.pre_api.moveFromJson(origin_mark,target_mark,file.getAttribute('file_id'))
            }
        }
        function findCard(ele){
            if(Array.from(ele.classList).includes('card')){
                return ele
            }else if(ele.id === 'main'){
                return null
            }else{
                return findCard(ele.parentNode)
            }
        }
        function file_mouseup(){
            file.removeEventListener('mousemove',file_mousemove)
            file.removeEventListener('mouseup',file_mouseup)
        }
    })
    file.addEventListener('click',(event) => {
        if(event.target.className == 'release') return
        window.pre_api.shellOpen(file.getAttribute('file_id'),file.parentNode.getAttribute('mark'))
    })
}

function addImageControl(image_path){
    const div = document.createElement('div')
    div.className = 'wp_choice_box_item'
    div.setAttribute('image_path',image_path)
    const img = document.createElement('img')
    img.className = 'image_display'
    img.src = image_path
    div.insertAdjacentElement('beforeend',img)
    const root = document.querySelector(':root')
    document.querySelector('.wp_choice_box').insertAdjacentElement('afterbegin',div)
    div.addEventListener('click',() => {
        Array.from(document.querySelectorAll('.wp_choice_box_item')).forEach(i => i.classList.remove('wp_choice_box_item_selected'))
        div.classList.add('wp_choice_box_item_selected')
        document.querySelector('.wp_display_cur_img').src = div.getAttribute('image_path')
        let a = div.getAttribute('image_path').split('\\')
        a = a[a.length - 1]
        document.styleSheets[0].addRule('.wp_display_cur_img_2',`background-image: url("./save_files/wallpaper/${a}")`)
    })
    if(Array.from(document.querySelectorAll('.wp_choice_box_item')).length == 1) div.click()
}

function getWindowCurrentWallpaper(){
    window.pre_api.getCurrentWallpaper().then(({p,m}) => {
        if(p){
            document.querySelector('.wp_display_cur_img').src = p
            const cur = Array.from(document.querySelectorAll('.wp_choice_box_item')).find(item => item.getAttribute('image_path') == p)
            if(cur){
                cur.click()
                Array.from(document.querySelectorAll('.wp_mode')).find(wp_mode => wp_mode.getAttribute('mode') == m).click()
            }
        }else{
            const first_image = Array.from(document.querySelectorAll('.wp_choice_box_item'))[0]
            if(first_image){
                document.querySelector('.wp_display_cur_img').src = first_image.getAttribute('image_path')
                first_image.click()
            }
        }
    })
}

function createOrder(data){
    const root = document.querySelector(':root')
    const order_item = document.createElement('div')
    const opshow_main_info = document.createElement('div')
    const single_files_node = document.createElement('div')
    const opshow_title = document.createElement('div')
    const opshow_detail = document.createElement('div')
    const opshow_files = document.createElement('div')
    const opshow_schedule = document.createElement('div')
    const opshow_control = document.createElement('div')
    const schedule_strip = document.createElement('div')
    const schedule_strip_s = document.createElement('div')
    const single_files_node_inbox = document.createElement('div')
    const schedule_strip_t = document.createElement('p')
    const opshow_cancel = document.createElement('button')
    const opshow_alter = document.createElement('button')
    const opshow_complete = document.createElement('button')
    const opshow_subtask = document.createElement('button')
    order_item.classList.add('order_item')
    opshow_main_info.classList.add('opshow_main_info')
    single_files_node.classList.add('single_files_node')
    opshow_title.classList.add('opshow_title')
    opshow_detail.classList.add('opshow_detail')
    opshow_files.classList.add('opshow_files')
    opshow_schedule.classList.add('opshow_schedule')
    opshow_control.classList.add('opshow_control')
    schedule_strip.classList.add('schedule_strip')
    schedule_strip_s.classList.add('schedule_strip_s')
    single_files_node_inbox.classList.add('single_files_node_inbox')
    schedule_strip_t.classList.add('schedule_strip_t')
    opshow_cancel.classList.add('opshow_cancel')
    opshow_alter.classList.add('opshow_alter')
    opshow_complete.classList.add('opshow_complete')
    opshow_subtask.classList.add('opshow_subtask')
    single_files_node.insertAdjacentElement('beforeend',single_files_node_inbox)
    order_item.insertAdjacentElement('beforeend',opshow_main_info)
    order_item.insertAdjacentElement('beforeend',single_files_node)
    opshow_control.insertAdjacentElement('beforeend',opshow_cancel)
    opshow_control.insertAdjacentElement('beforeend',opshow_alter)
    opshow_control.insertAdjacentElement('beforeend',opshow_complete)
    opshow_control.insertAdjacentElement('beforeend',opshow_subtask)
    schedule_strip.insertAdjacentElement('beforeend',schedule_strip_s)
    schedule_strip.insertAdjacentElement('beforeend',schedule_strip_t)
    opshow_schedule.insertAdjacentElement('beforeend',schedule_strip)
    opshow_main_info.insertAdjacentElement('beforeend',opshow_title)
    opshow_main_info.insertAdjacentElement('beforeend',opshow_detail)
    opshow_main_info.insertAdjacentElement('beforeend',opshow_files)
    opshow_main_info.insertAdjacentElement('beforeend',opshow_schedule)
    opshow_main_info.insertAdjacentElement('beforeend',opshow_control)
    opshow_cancel.innerText = '删除'
    opshow_alter.innerText = '修改'
    opshow_complete.innerText = '完成'
    opshow_subtask.innerText = '展开'
    data.files.forEach(file => {
        const opshow_file = document.createElement('div')
        const opshow_file_icon = document.createElement('img')
        const opshow_file_name = document.createElement('p')
        opshow_file.classList.add('opshow_file')
        opshow_file_icon.classList.add('opshow_file_icon')
        opshow_file_name.classList.add('opshow_file_name')
        opshow_file.insertAdjacentElement('beforeend',opshow_file_icon)
        opshow_file.insertAdjacentElement('beforeend',opshow_file_name)
        opshow_file_icon.src = file.icon_path
        opshow_file_name.innerText = file.name
        opshow_files.insertAdjacentElement('beforeend',opshow_file)
        opshow_file.setAttribute('file_id',file.file_id)
        opshow_file.addEventListener('click',() => {
            const file_id = opshow_file.getAttribute('file_id')
            const order_id = data.order_id
            console.log(order_id,file_id)
        })
        /////////////////////////////////////////////////
        const single_file_node = document.createElement('div')
        const single_file_node_name = document.createElement('div')
        const single_file_node_icon = document.createElement('img')
        const single_file_node_done = document.createElement('img')
        const single_file_node_not = document.createElement('img')
        single_file_node.classList.add('single_file_node')
        single_file_node_name.classList.add('single_file_node_name')
        single_file_node_icon.classList.add('single_file_node_icon')
        single_file_node_done.classList.add('single_file_node_done')
        single_file_node_not.classList.add('single_file_node_not')
        single_file_node.insertAdjacentElement('beforeend',single_file_node_icon)
        single_file_node.insertAdjacentElement('beforeend',single_file_node_name)
        single_file_node.insertAdjacentElement('beforeend',single_file_node_done)
        single_file_node.insertAdjacentElement('beforeend',single_file_node_not)
        single_files_node_inbox.insertAdjacentElement('beforeend',single_file_node)
        single_file_node.setAttribute('file_id',file.file_id)
        single_file_node_icon.src = file.icon_path
        single_file_node_name.innerText = file.name
        single_file_node_done.src = './resources/images/done.png'
        single_file_node_not.src = './resources/images/not.png'
        if(file.done){
            single_file_node_done.classList.add('single_file_node_display')
        }else{
            single_file_node_not.classList.add('single_file_node_display')
        }
        single_file_node_done.addEventListener('click',() => {
            file.done = false
            single_file_node_done.classList.remove('single_file_node_display')
            single_file_node_not.classList.add('single_file_node_display')
            root.style.setProperty(`--schedule_strip_s-width_${data.order_id}`, `${Math.floor(100 * (data.files.filter(f => f.done).length / data.files.length))}%`)
            schedule_strip_t.innerText = `${data.files.filter(f => f.done).length}/${data.files.length}`
            window.pre_api.updateOrderFileStatus(data.order_id,file.file_id,file.done)
        })
        single_file_node_not.addEventListener('click',() => {
            file.done = true
            single_file_node_done.classList.add('single_file_node_display')
            single_file_node_not.classList.remove('single_file_node_display')
            root.style.setProperty(`--schedule_strip_s-width_${data.order_id}`, `${Math.floor(100 * (data.files.filter(f => f.done).length / data.files.length))}%`)
            schedule_strip_t.innerText = `${data.files.filter(f => f.done).length}/${data.files.length}`
            window.pre_api.updateOrderFileStatus(data.order_id,file.file_id,file.done)
        })
    })
    opshow_title.innerText = data.title
    opshow_detail.innerText = data.detail
    order_item.setAttribute('order_id',data.order_id)
    root.style.setProperty(`--schedule_strip_s-width_${data.order_id}`, `${Math.floor(100 * (data.files.filter(f => f.done).length / (data.files.length || 1)))}%`)
    schedule_strip_t.innerText = `${data.files.filter(f => f.done).length}/${data.files.length || 1}`
    if(data.done){
        root.style.setProperty(`--schedule_strip_s-width_${data.order_id}`,'100%')
        schedule_strip_t.innerText = '√'
        opshow_complete.innerText = '做完'
    }
    document.styleSheets[0].addRule(`.schedule_strip_s-width_${data.order_id}`,`width: var(--schedule_strip_s-width_${data.order_id});transition: all .3s;`)
    schedule_strip_s.classList.add(`schedule_strip_s-width_${data.order_id}`)
    opshow_cancel.addEventListener('click',() => {
        if(data.files.filter(f => f.done).length/(data.files.length || 1) < 1 && !data.done){
            if(!confirm(`任务还未完成，确定要移出[${data.title}]该任务吗？`)) return
        }
        if(!confirm(`确定要移出[${data.title}]该任务吗？`)) return
        const order_id = data.order_id
        window.pre_api.removeOrder(order_id).then(status => {
            if(status){
                order_item.parentNode.removeChild(order_item)
            }
        })
    })
    opshow_alter.addEventListener('click',() => {
        updateOrderType = '0'
        updateOrder(data)
    })
    opshow_complete.addEventListener('click',() => {
        const order_id = data.order_id
        if(data.done){
            if(!confirm('任务已完成，是否需要重启任务')) return
            data.done = false
            opshow_complete.innerText = '完成'
            data.files.forEach(file => {
                file.done = false
            })
            schedule_strip_t.innerText = `${data.files.filter(f => f.done).length}/${data.files.length || 1}`
            root.style.setProperty(`--schedule_strip_s-width_${data.order_id}`,'0')
            Array.from(document.querySelectorAll('.single_file_node_done')).forEach(d => d.click())
            window.pre_api.restartOrder(order_id)
            updateOrderType = '1'
            updateOrder(data)
        }else{
            data.done = true
            opshow_complete.innerText = '做完'
            data.files.forEach(file => {
                file.done = true
            })
            schedule_strip_t.innerText = '√'
            root.style.setProperty(`--schedule_strip_s-width_${data.order_id}`,'100%')
            if(single_files_node.className.includes('single_files_node_spread')){
                single_files_node.classList.remove('single_files_node_spread')
                opshow_subtask.innerText = '展开'
            }
            setTimeout(() => {confirm(`任务[${data.title}]已完成`)},300)
            window.pre_api.completeOrder(order_id)
        }
    })
    opshow_subtask.addEventListener('click',() => {
        if(data.done) return
        if(single_files_node.className.includes('single_files_node_spread')){
            single_files_node.classList.remove('single_files_node_spread')
            opshow_subtask.innerText = '展开'
        }else{
            single_files_node.classList.add('single_files_node_spread')
            opshow_subtask.innerText = '收起'
        }
    })
    document.querySelector('.op_body').insertAdjacentElement('beforeend',order_item)
}

let files = []
function addOrderFile(file){
    const id = file.file_id
    const file_item = document.createElement('div')
    file_item.classList.add('opc_file_item')
    file_item.setAttribute('file_path',file.file_path)
    file_item.setAttribute('file_id',file.file_id)
    const file_item_innerHTML = `
        <img class="opc_file_item_icon" src="${file.icon_path}" />
        <div class="opc_file_item_name">${file.name}</div>
        <div class="opc_file_deadline"></div>
        <div class="opc_file_remind">
            <p>提醒频繁度</p>
            <input class="opc_file_remind_times" id="opc_file_remind_times_${id}" checked type="radio" name="opc_file_remind_control_${id}" />
            <label for="opc_file_remind_times_${id}">每次</label>
            <div class="opc_file_remind_times_control">
                <input class="ofrtc ofrtc_year" id="ofrtc_year_${id}" type="radio" name="ofrtc_${id}" />
                <label for="ofrtc_year_${id}" class="opc_file_remind_times_year">
                    <div class="time_text">年</div>
                    <div class="time_set">
                        <div>每年</div>
                        <select></select>
                        <div>月</div>
                        <select></select>
                        <div>日</div>
                        <select></select>
                        <div>时</div>
                        <select></select>
                        <div>分</div>
                    </div>
                </label>
                <input class="ofrtc ofrtc_month" id="ofrtc_month_${id}" type="radio" name="ofrtc_${id}" />
                <label for="ofrtc_month_${id}" class="opc_file_remind_times_month">
                    <div class="time_text">月</div>
                    <div class="time_set">
                        <div>每月</div>
                        <select></select>
                        <div>号</div>
                        <select></select>
                        <div>时</div>
                        <select></select>
                        <div>分</div>
                    </div>
                </label>
                <input class="ofrtc ofrtc_week" id="ofrtc_week_${id}" type="radio" name="ofrtc_${id}" />
                <label for="ofrtc_week_${id}" class="opc_file_remind_times_week">
                    <div class="time_text">周</div>
                    <div class="time_set">
                        <div>每周 星期</div>
                        <select></select>
                        <div>&nbsp;&nbsp;</div>
                        <select></select>
                        <div>时</div>
                        <select></select>
                        <div>分</div>
                    </div>
                </label>
                <input class="ofrtc ofrtc_day" id="ofrtc_day_${id}" checked type="radio" name="ofrtc_${id}" />
                <label for="ofrtc_day_${id}" class="opc_file_remind_times_day">
                    <div class="time_text">日</div>
                    <div class="time_set">
                        <div>每天</div>
                        <select></select>
                        <div>时</div>
                        <select></select>
                        <div>分</div>
                    </div>
                </label>
                <input class="ofrtc ofrtc_hour" id="ofrtc_hour_${id}" type="radio" name="ofrtc_${id}" />
                <label for="ofrtc_hour_${id}" class="opc_file_remind_times_hour">
                    <div class="time_text">时</div>
                    <div class="time_set">
                        <div>每</div>
                        <input class="input_number" type="number" max="99" min="1" value="1"/>
                        <div>小时</div>
                    </div>
                </label>
                <input class="ofrtc ofrtc_minute" id="ofrtc_minute_${id}" type="radio" name="ofrtc_${id}" />
                <label for="ofrtc_minute_${id}" class="opc_file_remind_times_minute">
                    <div class="time_text">分</div>
                    <div class="time_set">
                        <div>每</div>
                        <input class="input_number" type="number" max="99" min="1" value="1"/>
                        <div>分钟</div>
                    </div>
                </label>
            </div>
            <input class="opc_file_remind_custom" id="opc_file_remind_custom_${id}" type="radio" name="opc_file_remind_control_${id}" />
            <label for="opc_file_remind_custom_${id}">自定义</label>
            <div class="opc_file_remind_custom_control">
                <div class="opc_file_remind_custom_list"></div>
            </div>
        </div>
    `
    file_item.innerHTML = file_item_innerHTML
    getDeadlineHTML(file_item,'ofrtc_year_' + id,'ofrtc_month_' + id,'ofrtc_week_' + id,'ofrtc_day_' + id,file.deadline,file.frequency)
    const root = document.querySelector(':root')
    const opc_files = document.querySelector('.opc_files')
    opc_files.insertAdjacentElement('beforeend',file_item)
    const add_opc_file_remind_custom = document.createElement('div')
    add_opc_file_remind_custom.classList.add('add_opc_file_remind_custom')
    add_opc_file_remind_custom.innerText = '添加'
    add_opc_file_remind_custom.addEventListener('click',addCustomTime)
    file_item.querySelector('.opc_file_remind_custom_control').insertAdjacentElement('afterbegin',add_opc_file_remind_custom)
    const detele_order_file = document.createElement('div')
    detele_order_file.classList.add('detele_order_file')
    detele_order_file.innerText = '删除'
    detele_order_file.addEventListener('click',() => {
        file_item.parentNode.removeChild(file_item)
        if(Array.from(opc_files.children).length <= 1){
            root.style.setProperty("--opc_files_width", `160px`)
        }
        generateTitleAndDetail(getCreatingOrderFiles().map(f => f.name))
    })
    file_item.querySelector('.opc_file_remind').insertAdjacentElement('beforeend',detele_order_file)
    setTimeout(() => {
        opc_files.scrollTo({behavior:'smooth',top:opc_files.scrollHeight})
    },300)
    if(Array.from(opc_files.children).length > 1){
        root.style.setProperty("--opc_files_width", `315px`)
    }
    if(file.frequency){
        switch(file.frequency.type){
            case 'year':
                file_item.querySelector(`#ofrtc_year_${id}`).click()
                break
            case 'month':
                file_item.querySelector(`#ofrtc_month_${id}`).click()
                break
            case 'week':
                file_item.querySelector(`#ofrtc_week_${id}`).click()
                break
            case 'day':
                file_item.querySelector(`#ofrtc_day_${id}`).click()
                break
            case 'hour':
                file_item.querySelector(`#ofrtc_hour_${id}`).click()
                break
            case 'minute':
                file_item.querySelector(`#ofrtc_minute_${id}`).click()
                break
            case 'custom':
                file_item.querySelector(`#opc_file_remind_custom_${id}`).click()
        }
    }else{
        generateTitleAndDetail(getCreatingOrderFiles().map(f => f.name))
    }
}

function addCustomTime(event){
    const opc_file_remind_custom_list = event.target.nextElementSibling
    const opc_file_remind_custom_item = document.createElement('div')
    opc_file_remind_custom_item.classList.add('opc_file_remind_custom_item')
    getRemindHTML(opc_file_remind_custom_item)
    const detele = document.createElement('div')
    detele.classList.add('deteleCustomTime')
    detele.addEventListener('click',() => {
        detele.parentNode.parentNode.removeChild(detele.parentNode)
    })
    opc_file_remind_custom_item.insertAdjacentElement('beforeend',detele)
    opc_file_remind_custom_list.insertAdjacentElement('beforeend',opc_file_remind_custom_item)
    opc_file_remind_custom_list.scrollTo({behavior:'smooth',top:opc_file_remind_custom_list.scrollHeight})
}

function getDeadlineHTML(file_item,id,id2,id3,id4,deadline,frequency){
    const opc_file_deadline = file_item.querySelector('.opc_file_deadline')

    const p1 = document.createElement('p')
    p1.innerText = '截止日期：'
    const p2 = document.createElement('p')
    p2.innerText = '年'
    const p3 = document.createElement('p')
    p3.innerText = '月'
    const p4 = document.createElement('p')
    p4.innerText = '日'

    const select1 = document.createElement('select')
    const select2 = document.createElement('select')
    const select3 = document.createElement('select')

    select1.innerHTML = new Array(50).fill(new Date().getFullYear()).map((y,index) => `<option>${y + index}</option>`).join('')
    select2.innerHTML = new Array(12).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    select3.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')

    const months = [31,new Date().getFullYear() % 4 == 0 ? 29 : 28,31,30,31,30,31,31,30,31,30,31]

    select2.value = new Date().getMonth() + (months[new Date().getMonth()] == new Date().getDate() ? 2 : 1)
    if(select2.value == 13){
        select2.value = 1
        select1.value = select1.value + 1
    }
    select3.value = months[new Date().getMonth()] == new Date().getDate() ? 1 : new Date().getDate() + 1

    let year = new Date().getFullYear()
    select1.addEventListener('change',() => {
        select2.value = 1
        year = Number(select1.value)
        if(Number(year) % 4 == 0) months[1] = 29
        else months[1] = 28
        select3.innerHTML = new Array(months[month - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })
    let month = new Date().getMonth()
    select2.addEventListener('change',() => {
        select3.value = 1
        month = Number(select2.value)
        select3.innerHTML = new Array(months[month - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })
    if(deadline){
        select1.value = deadline[0]
        select2.value = deadline[1]
        select3.value = deadline[2]
    }

    opc_file_deadline.insertAdjacentElement('beforeend',p1)
    opc_file_deadline.insertAdjacentElement('beforeend',select1)
    opc_file_deadline.insertAdjacentElement('beforeend',p2)
    opc_file_deadline.insertAdjacentElement('beforeend',select2)
    opc_file_deadline.insertAdjacentElement('beforeend',p3)
    opc_file_deadline.insertAdjacentElement('beforeend',select3)
    opc_file_deadline.insertAdjacentElement('beforeend',p4)

    const target_box_year = file_item.querySelector(`#${id}`).nextElementSibling.querySelector('.time_set')
    const [s_month,s_day,s_hour,s_minute] = Array.from(target_box_year.querySelectorAll('select'))

    s_month.innerHTML = new Array(12).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    s_day.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    s_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    s_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    s_month.addEventListener('change',() => {
        s_day.innerHTML = new Array(months[Number(s_month.value) - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })

    const target_box_month = file_item.querySelector(`#${id2}`).nextElementSibling.querySelector('.time_set')
    const [m_day,m_hour,m_minute] = Array.from(target_box_month.querySelectorAll('select'))
    m_day.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    m_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    m_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    const target_box_week = file_item.querySelector(`#${id3}`).nextElementSibling.querySelector('.time_set')
    const [w_week,w_hour,w_minute] = Array.from(target_box_week.querySelectorAll('select'))
    w_week.innerHTML = new Array(7).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    w_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    w_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    const target_box_day = file_item.querySelector(`#${id4}`).nextElementSibling.querySelector('.time_set')
    const [d_hour,d_minute] = Array.from(target_box_day.querySelectorAll('select'))
    d_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    d_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    d_hour.value = 11

    if(frequency){
        switch(frequency.type){
            case 'year':
                s_month.value = frequency.times[0]
                s_day.value = frequency.times[1]
                s_hour.value = frequency.times[2]
                s_minute.value = frequency.times[3]
                break
            case 'month':
                m_day.value = frequency.times[0]
                m_hour.value = frequency.times[1]
                m_minute.value = frequency.times[2]
                break
            case 'week':
                w_week.value = frequency.times[0]
                w_hour.value = frequency.times[1]
                w_minute.value = frequency.times[2]
                break
            case 'day':
                d_hour.value = frequency.times[0]
                d_minute.value = frequency.times[1]
                break
            case 'hour':
                Array.from(file_item.querySelectorAll('.input_number'))[0].value = frequency.times[0]
                break
            case 'minute':
                Array.from(file_item.querySelectorAll('.input_number'))[1].value = frequency.times[0]
                break
            case 'custom':
                frequency.times.forEach(point => {
                    const opc_file_remind_custom_list = file_item.querySelector('.opc_file_remind_custom_list')
                    const opc_file_remind_custom_item = document.createElement('div')
                    opc_file_remind_custom_item.classList.add('opc_file_remind_custom_item')
                    getRemindHTML(opc_file_remind_custom_item,point)
                    const detele = document.createElement('div')
                    detele.classList.add('deteleCustomTime')
                    detele.addEventListener('click',() => {
                        detele.parentNode.parentNode.removeChild(detele.parentNode)
                    })
                    opc_file_remind_custom_item.insertAdjacentElement('beforeend',detele)
                    opc_file_remind_custom_list.insertAdjacentElement('beforeend',opc_file_remind_custom_item)
                })
        }
    }
}

function getRemindHTML(doc,point){
    let select_year = document.createElement('select')
    let select_month = document.createElement('select')
    let select_day = document.createElement('select')
    let select_hour = document.createElement('select')
    let select_minute = document.createElement('select')
    let select_second = document.createElement('select')
    let div_year = document.createElement('div')
    let div_month = document.createElement('div')
    let div_day = document.createElement('div')
    let div_hour = document.createElement('div')
    let div_minute = document.createElement('div')
    let div_second = document.createElement('div')

    div_year.innerText = '年'
    div_month.innerText = '月'
    div_day.innerText = '日'
    div_hour.innerText = '时'
    div_minute.innerText = '分'
    div_second.innerText = '秒'

    select_year.innerHTML = new Array(50).fill(new Date().getFullYear()).map((y,index) => `<option>${y + index}</option>`).join('')
    select_month.innerHTML = new Array(12).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    select_day.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    select_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    select_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    select_second.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    const months = [31,new Date().getFullYear() % 4 == 0 ? 29 : 28,31,30,31,30,31,31,30,31,30,31]

    select_month.value = new Date().getMonth() + (months[new Date().getMonth()] == new Date().getDate() ? 2 : 1)
    if(select_month.value == 13){
        select_month.value = 1
        select_year.value = select_year.value + 1
    }
    select_day.value = months[new Date().getMonth()] == new Date().getDate() ? 1 : new Date().getDate() + 1
    select_hour.value = 14

    let year = new Date().getFullYear()
    select_year.addEventListener('change',() => {
        select_month.value = 1
        year = Number(select_year.value)
        if(Number(year) % 4 == 0) months[1] = 29
        else months[1] = 28
        select_day.innerHTML = new Array(months[month - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })
    let month = new Date().getMonth()
    select_month.addEventListener('change',() => {
        select_day.value = 1
        month = Number(select_month.value)
        select_day.innerHTML = new Array(months[month - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })

    doc.insertAdjacentElement('beforeend',select_year)
    doc.insertAdjacentElement('beforeend',div_year)
    doc.insertAdjacentElement('beforeend',select_month)
    doc.insertAdjacentElement('beforeend',div_month)
    doc.insertAdjacentElement('beforeend',select_day)
    doc.insertAdjacentElement('beforeend',div_day)
    doc.insertAdjacentElement('beforeend',select_hour)
    doc.insertAdjacentElement('beforeend',div_hour)
    doc.insertAdjacentElement('beforeend',select_minute)
    doc.insertAdjacentElement('beforeend',div_minute)
    doc.insertAdjacentElement('beforeend',select_second)
    doc.insertAdjacentElement('beforeend',div_second)

    if(point){
        select_year.value = point[0]
        select_month.value = point[1]
        select_day.value = point[2]
        select_hour.value = point[3]
        select_minute.value = point[4]
        select_second.value = point[5]
    }
}

function calOrderDeadline(){
    const sel_year = document.querySelector('.sel_year')
    const sel_month = document.querySelector('.sel_month')
    const sel_day = document.querySelector('.sel_day')
    const sel_hour = document.querySelector('.sel_hour')
    const sel_minute = document.querySelector('.sel_minute')

    sel_year.innerHTML = new Array(50).fill(new Date().getFullYear()).map((y,index) => `<option>${y + index}</option>`).join('')
    sel_month.innerHTML = new Array(12).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    sel_day.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    sel_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    sel_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    const months = [31,new Date().getFullYear() % 4 == 0 ? 29 : 28,31,30,31,30,31,31,30,31,30,31]

    sel_month.value = new Date().getMonth() + (months[new Date().getMonth()] == new Date().getDate() ? 2 : 1)
    if(sel_month.value == 13){
        sel_month.value = 1
        sel_year.value = sel_year.value + 1
    }
    sel_day.value = months[new Date().getMonth()] == new Date().getDate() ? 1 : new Date().getDate() + 1
    sel_hour.value = 14

    let year = new Date().getFullYear()
    sel_year.addEventListener('change',() => {
        sel_month.value = 1
        year = Number(sel_year.value)
        if(Number(year) % 4 == 0) months[1] = 29
        else months[1] = 28
        sel_day.innerHTML = new Array(months[month - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })
    let month = new Date().getMonth()
    sel_month.addEventListener('change',() => {
        sel_day.value = 1
        month = Number(sel_month.value)
        sel_day.innerHTML = new Array(months[month - 1]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })
}

function setOrderRemindTimes(){
    const times_year_month = document.querySelector('.times_year_month')
    const times_year_day = document.querySelector('.times_year_day')
    const times_year_hour = document.querySelector('.times_year_hour')
    const times_year_minute = document.querySelector('.times_year_minute')

    times_year_month.innerHTML = new Array(12).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    times_year_day.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    times_year_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    times_year_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    const months = [31,new Date().getFullYear() % 4 == 0 ? 29 : 28,31,30,31,30,31,31,30,31,30,31]

    times_year_month.addEventListener('change',() => {
        times_year_day.innerHTML = new Array(months[Number(times_year_month.value - 1)]).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    })

    let times_month_day = document.querySelector('.times_month_day')
    let times_month_hour = document.querySelector('.times_month_hour')
    let times_month_minute = document.querySelector('.times_month_minute')

    times_month_day.innerHTML = new Array(31).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    times_month_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    times_month_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    let times_week_week = document.querySelector('.times_week_week')
    let times_week_hour = document.querySelector('.times_week_hour')
    let times_week_minute = document.querySelector('.times_week_minute')

    times_week_week.innerHTML = new Array(7).fill(1).map((m,index) => `<option>${m + index}</option>`).join('')
    times_week_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    times_week_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')

    let times_day_hour = document.querySelector('.times_day_hour')
    let times_day_minute = document.querySelector('.times_day_minute')

    times_day_hour.innerHTML = new Array(24).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    times_day_minute.innerHTML = new Array(60).fill(0).map((m,index) => `<option>${m + index}</option>`).join('')
    times_day_hour.value = 11
    times_day_minute.value = 0
}

function windowFocusable(){
    window.pre_api.windowFocusable()
}

function windowUnfocusable(){
    window.pre_api.windowUnfocusable()
}

function getCreatingOrderFiles(){
    const files_template = Array.from(document.querySelectorAll('.opc_file_item'))
    const files = []
    files_template.forEach(template => {
        const file = {
            file_id:template.getAttribute('file_id'),
            icon_path:template.querySelector('.opc_file_item_icon').src,
            name:template.querySelector('.opc_file_item_name').innerText,
            file_path:template.getAttribute('file_path'),
            done:false,
            deadline:Array.from(template.querySelector('.opc_file_deadline').querySelectorAll('select')).map(s => s.value)
        }
        let branch_1 = template.querySelector('.opc_file_remind_times').checked
        const remind_way = {}
        if(branch_1){
            const strip = Array.from(document.getElementsByName(template.querySelector('.ofrtc_year').name)).find(s => s.checked)
            const label_class = strip.nextElementSibling.className
            remind_way.type = label_class.split('_')[label_class.split('_').length - 1]
            switch(remind_way.type){
                case 'year':
                case 'month':
                case 'week':
                case 'day':
                    remind_way.times = Array.from(strip.nextElementSibling.querySelectorAll('select')).map(s => s.value)
                    break
                case 'hour':
                case 'minute':
                    remind_way.times = strip.nextElementSibling.querySelector('input').value
            }
        }else{
            remind_way.type = 'custom'
            const points = template.querySelector('.opc_file_remind_custom_list')
            const time_points = []
            Array.from(points.querySelectorAll('.opc_file_remind_custom_item')).forEach(point => {
                time_points.push(Array.from(point.querySelectorAll('select')).map(s => s.value))
            })
            remind_way.times = time_points
        }
        file.frequency = remind_way
        files.push(file)
    })
    return files
}

function getCreatingOrderInfo(){
    const title = document.querySelector('.opc_title_text').value
    const detail = document.querySelector('.opc_detail_text').value
    const deadline = [
        document.querySelector('.sel_year').value,
        document.querySelector('.sel_month').value,
        document.querySelector('.sel_day').value,
        document.querySelector('.sel_hour').value,
        document.querySelector('.sel_minute').value
    ]
    const remind_way = {}
    if(document.querySelector('#opc_order_remind_times').checked){
        const input = Array.from(document.getElementsByName('ofrtc2_')).find(input => input.checked)
        const label_class = input.nextElementSibling.className
        remind_way.type = label_class.split('_')[label_class.split('_').length - 1]
        switch(remind_way.type){
            case 'year':
            case 'month':
            case 'week':
            case 'day':
                remind_way.times = Array.from(input.nextElementSibling.querySelectorAll('select')).map(s => s.value)
                break
            case 'hour':
            case 'minute':
                remind_way.times = input.nextElementSibling.querySelector('input').value
        }
    }else{
        remind_way.type = 'custom'
        const points = document.querySelector('.opc_order_remind').querySelector('.opc_file_remind_custom_list')
        const time_points = []
        Array.from(points.querySelectorAll('.opc_file_remind_custom_item')).forEach(point => {
            time_points.push(Array.from(point.querySelectorAll('select')).map(s => s.value))
        })
        remind_way.times = time_points
    }
    const frequency = remind_way
    const order = {
        title,
        detail,
        deadline,
        frequency,
        done:false,
        files:getCreatingOrderFiles()
    }
    return order
}

function generateTitleAndDetail(files_name){
    const types = []
    files_name.forEach(name => {
        types.push(getTypeBySuffix(name))
    })
    const set_types = new Set(types)
    generateTitle(types,set_types,files_name)
    generateDetail(files_name)
}

function getTypeBySuffix(name){
    const suffix = name.split('.')[name.split('.').length - 1]
    let type
    switch(suffix){
        case 'jpg':
        case 'jpeg':
        case 'jpe':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'tiff':
        case 'tif':
        case 'raw':
        case 'webp':
        case 'svg':
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'aac':
        case 'flac':
        case 'wma':
        case 'm4a':
        case 'amr':
        case 'ape':
        case 'aiff':
        case 'au':
        case 'mid':
        case 'midi':
        case 'ra':
        case 'ram':
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'mkv':
        case 'wmv':
        case 'flv':
        case 'webm':
        case 'm4v':
        case 'rmvb':
        case '3gp':
        case 'mpeg':
        case 'mpg':
        case 'ogv':
        case 'pdf':
            type = 'read'
            break
        case 'doc':
        case 'docx':
        case 'rtf':
        case 'txt':
        case 'xls':
        case 'xlsx':
        case 'csv':
        case 'ppt':
        case 'pptx':
            type = 'edit'
            break
        case 'exe':
        case 'lnk':
            type = 'exe'
            break
        default:
            type = 'other'
    }
    return type
}

let title_has_been_edited_by_user = false
function generateTitle(types,set_types,[file_name]){
    const input = document.querySelector('.opc_title_text')
    if(title_has_been_edited_by_user && input.value !== '') return
    let title = ''
    switch(set_types.size){
        case 4:
        case 3:
            title = '完成相关文件操作'
            break
        case 2:
            if(set_types.has('read') && set_types.has('edit')){
                title = '编辑预览文件'
            }else if(set_types.has('read') && set_types.has('exe')){
                title = '预览文件并打开程序'
            }else if(set_types.has('read') && set_types.has('other')){
                title = '查看并操作相关文件'
            }else if(set_types.has('exe') && set_types.has('edit')){
                title = '编写文件并启动程序'
            }else if(set_types.has('other') && set_types.has('edit')){
                title = '编写操作相关文件'
            }else if(set_types.has('exe') && set_types.has('other')){
                title = '启动程序并操作相关文件'
            }
            break
        case 1:
            if(set_types.has('read')){
                title = types.length === 1 ? `预览${file_name}文件` : '查看文件'
            }else if(set_types.has('edit')){
                title = types.length === 1 ? `完成${file_name}的编写` : '编写文件'
            }else if(set_types.has('exe')){
                title = types.length === 1 ? `启动${file_name.split('.').slice(0,file_name.split('.').length - 1)}程序` : '启动多个程序'
            }else if(set_types.has('other')){
                title = types.length === 1 ? `操作${file_name}文件` : '操作文件'
            }
    }
    input.value = title
}

let detail_has_been_edited_by_user = false
function generateDetail(files_name){
    const textarea = document.querySelector('.opc_detail_text')
    if(detail_has_been_edited_by_user && textarea.value !== '') return
    let detail = ''
    files_name.forEach(name => {
        if(getTypeBySuffix(name) == 'read'){
            detail = detail + (detail === '' ? '' : '\n') + `预览${name}文件`
        }else if(getTypeBySuffix(name) == 'edit'){
            detail = detail + (detail === '' ? '' : '\n') + `编辑${name}文件`
        }else if(getTypeBySuffix(name) == 'exe'){
            detail = detail + (detail === '' ? '' : '\n') + `启动${name.split('.').slice(0,name.split('.').length - 1)}程序`
        }else if(getTypeBySuffix(name) == 'other'){
            detail = detail + (detail === '' ? '' : '\n') + `操作${name}文件`
        }
    })
    textarea.value = detail
}

function clearCreatingOrderInfo(){
    document.querySelector('.opc_title_text').value = ''
    document.querySelector('.opc_detail_text').value = ''
    document.querySelector('.order_times_hour').value = ''
    document.querySelector('.order_times_minute').value = ''
    document.querySelector('.opc_files').innerHTML = ''
    document.querySelector('.opc_file_remind_custom_list').innerHTML = ''
    calOrderDeadline()
    setOrderRemindTimes()
    document.querySelector(':root').style.setProperty("--opc_files_width", `160px`)
    document.querySelector(':root').style.setProperty("--basic_scale2", `0.3`)
    document.querySelector('#ofrtc2_day').click()
}

let isUpdateOrder = false
function updateOrder(order){
    if(order.done) return
    document.querySelector('.op_create').click()
    isUpdateOrder = true
    clearCreatingOrderInfo()
    orderDataEcho(order)
}

let updateOrderType = '0',updateOrderId
function orderDataEcho(order){
    const root = document.querySelector(':root')
    document.querySelector('.opc_title_text').value = order.title
    document.querySelector('.opc_detail_text').value = order.detail
    order.files.forEach(file => {
        addOrderFile(file)
    })
    document.querySelector('.sel_year').value = order.deadline[0]
    document.querySelector('.sel_month').value = order.deadline[1]
    document.querySelector('.sel_day').value = order.deadline[2]
    document.querySelector('.sel_hour').value = order.deadline[3]
    document.querySelector('.sel_minute').value = order.deadline[4]
    switch(order.frequency.type){
        case 'year':
            document.querySelector('.times_year_month').value = order.frequency.times[0]
            document.querySelector('.times_year_day').value = order.frequency.times[1]
            document.querySelector('.times_year_hour').value = order.frequency.times[2]
            document.querySelector('.times_year_minute').value = order.frequency.times[3]
            document.querySelector('#ofrtc2_year').click()
            root.style.setProperty("--basic_scale2", '0')
            break
        case 'month':
            document.querySelector('.times_month_day').value = order.frequency.times[0]
            document.querySelector('.times_month_hour').value = order.frequency.times[1]
            document.querySelector('.times_month_minute').value = order.frequency.times[2]
            document.querySelector('#ofrtc2_month').click()
            root.style.setProperty("--basic_scale2", '0.1')
            break
        case 'week':
            document.querySelector('.times_week_week').value = order.frequency.times[0]
            document.querySelector('.times_week_hour').value = order.frequency.times[1]
            document.querySelector('.times_week_minute').value = order.frequency.times[2]
            document.querySelector('#ofrtc2_week').click()
            root.style.setProperty("--basic_scale2", '0.2')
            break
        case 'day':
            document.querySelector('.times_day_hour').value = order.frequency.times[0]
            document.querySelector('.times_day_minute').value = order.frequency.times[1]
            document.querySelector('#ofrtc2_day').click()
            root.style.setProperty("--basic_scale2", '0.3')
            break
        case 'hour':
            document.querySelector('.order_times_hour').value = order.frequency.times[0]
            document.querySelector('#ofrtc2_hour').click()
            root.style.setProperty("--basic_scale2", '0.4')
            break
        case 'minute':
            document.querySelector('.order_times_minute').value = order.frequency.times[0]
            document.querySelector('#ofrtc2_minute').click()
            root.style.setProperty("--basic_scale2", '0.5')
            break
        case 'custom':
            order.frequency.times.forEach(point => {
                const opc_order_remind_custom_list = document.querySelector('.opc_order_remind_custom_list')
                const opc_file_remind_custom_item = document.createElement('div')
                opc_file_remind_custom_item.classList.add('opc_file_remind_custom_item')
                getRemindHTML(opc_file_remind_custom_item,point)
                const detele = document.createElement('div')
                detele.classList.add('deteleCustomTime')
                detele.addEventListener('click',() => {
                    detele.parentNode.parentNode.removeChild(detele.parentNode)
                })
                opc_file_remind_custom_item.insertAdjacentElement('beforeend',detele)
                opc_order_remind_custom_list.insertAdjacentElement('beforeend',opc_file_remind_custom_item)
            })
            document.querySelector('#opc_order_remind_custom').click()
    }
    if(updateOrderType == '1'){
        document.querySelector('.opc_control_cancel').classList.add('cancel_disappear')
    }
    document.querySelector('.opc_control_create').innerText = '修改'
    updateOrderId = order.order_id
}
