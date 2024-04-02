window.addEventListener('DOMContentLoaded',async () => {
    const close = document.querySelector('.close')
    close.classList.add('close')
    close.src = '../resources/images/close.png'
    close.addEventListener('click',() => {
        Array.from(document.querySelectorAll('.order')).forEach(order => order.parentNode.removeChild(order))
        Array.from(document.querySelectorAll('.file')).forEach(file => file.parentNode.removeChild(file))
        window.pre_api.closeTip()
    })
    window.pre_api.getTip((target,type,order_id) => {
        if(type === 'order') orderRemind(target)
        else fileRemind(target,order_id)
        calculateHeight()
        setTimeout(() => {
            document.querySelector('.main').scrollTo({behavior:'smooth',top:document.querySelector('.main').scrollHeight})
        },100)
    })
})

function orderRemind(order_info){
    if(Array.from(document.querySelectorAll('.order')).find(order => order.getAttribute('order_id') == order_info.order_id)) return
    Array.from(document.querySelectorAll('.file'))
        .filter(file => {
            const files_id = order_info.files.map(file => file.file_id)
            return files_id.includes(file.getAttribute('file_id')) || files_id.includes(Number(file.getAttribute('file_id')))
        }).forEach(file => file.parentNode.removeChild(file))
    const order = document.createElement('div')
    const order_ico = document.createElement('img')
    const order_title = document.createElement('div')
    const order_foot = document.createElement('div')
    const order_deadline = document.createElement('div')
    const text = document.createElement('div')
    const text_2 = document.createElement('div')
    const complete = document.createElement('div')
    const ignore = document.createElement('div')
    order.classList.add('order')
    order_ico.classList.add('order_ico')
    order_title.classList.add('order_title')
    order_foot.classList.add('order_foot')
    order_deadline.classList.add('order_deadline')
    text.classList.add('text')
    text_2.classList.add('text')
    complete.classList.add('complete')
    ignore.classList.add('ignore')

    order_deadline.insertAdjacentElement('beforeend',text)
    order_deadline.insertAdjacentElement('beforeend',text_2)
    order_foot.insertAdjacentElement('beforeend',order_deadline)
    order_foot.insertAdjacentElement('beforeend',complete)
    order_foot.insertAdjacentElement('beforeend',ignore)
    order.insertAdjacentElement('beforeend',order_ico)
    order.insertAdjacentElement('beforeend',order_title)
    order.insertAdjacentElement('beforeend',order_foot)

    order.setAttribute('order_id',order_info.order_id)
    order_ico.src = '../resources/images/order.png'
    order_title.innerText = order_info.title
    order_info.files.forEach(file => {
        const order_file = document.createElement('div')
        const file_name = document.createElement('div')
        const file_deadline = document.createElement('div')
        const done = document.createElement('input')

        order_file.classList.add('order_file')
        file_name.classList.add('file_name')
        file_deadline.classList.add('file_deadline')
        done.classList.add('done')

        order_file.insertAdjacentElement('beforeend',file_name)
        order_file.insertAdjacentElement('beforeend',file_deadline)
        order_file.insertAdjacentElement('beforeend',done)

        file_name.innerText = file.name
        file_deadline.innerText = `截止：${file.deadline[0]}年${file.deadline[1]}月${file.deadline[2]}日`
        done.type = 'checkbox'
        done.checked = file.done
        done.setAttribute('file_id',file.file_id)
        done.addEventListener('change',(event) => {
            const file_id = event.target.getAttribute('file_id')
            window.pre_api.changeFileStatus(file_id,event.target.checked)
        })

        order_foot.insertAdjacentElement('beforebegin',order_file)
    })
    text.innerText = '任务截止日期：'
    text_2.innerText = `${order_info.deadline[0]}年${order_info.deadline[1]}月${order_info.deadline[2]}日${order_info.deadline[3]}时${order_info.deadline[4]}分`
    complete.innerText = '完成任务'
    ignore.innerText = '忽略'
    complete.addEventListener('click',() => {
        const order_id = order_info.order_id
        window.pre_api.completeOrder(order_id)
        ignoreTip(order)
    })
    ignore.addEventListener('click',() => {
        ignoreTip(order)
    })
    document.querySelector('.main').insertAdjacentElement('beforeend',order)
}

function fileRemind(file_info,order_id){
    if(Array.from(document.querySelectorAll('.order')).find(order => order.getAttribute('order_id') == order_id)) return
    if(Array.from(document.querySelectorAll('.file')).find(file => file.getAttribute('file_id') == file_info.file_id)) return
    const file = document.createElement('div')
    const show = document.createElement('div')
    const order_ico = document.createElement('img')
    const file_name_2 = document.createElement('div')
    const file_deadline_2 = document.createElement('div')
    const control = document.createElement('div')
    const complete_file = document.createElement('div')
    const ignore_file = document.createElement('div')

    file.classList.add('file')
    show.classList.add('show')
    order_ico.classList.add('order_ico')
    file_name_2.classList.add('file_name_2')
    file_deadline_2.classList.add('file_deadline_2')
    control.classList.add('control')
    complete_file.classList.add('complete_file')
    ignore_file.classList.add('ignore_file')

    file.setAttribute('file_id',file_info.file_id)
    order_ico.src = '../resources/images/file.png'
    file_name_2.innerText = file_info.name
    file_deadline_2.innerText = `截止：${file_info.deadline[0]}年${file_info.deadline[1]}月${file_info.deadline[2]}日`
    complete_file.innerText = '完成任务'
    ignore_file.innerText = '忽略'
    complete_file.addEventListener('click',() => {
        const file_id = file_info.file_id
        window.pre_api.changeFileStatus(file_id,true)
        ignoreTip(file)
    })
    ignore_file.addEventListener('click',() => {
        ignoreTip(file)
    })
    control.insertAdjacentElement('beforeend',complete_file)
    control.insertAdjacentElement('beforeend',ignore_file)
    show.insertAdjacentElement('beforeend',order_ico)
    show.insertAdjacentElement('beforeend',file_name_2)
    show.insertAdjacentElement('beforeend',file_deadline_2)
    file.insertAdjacentElement('beforeend',show)
    file.insertAdjacentElement('beforeend',control)
    document.querySelector('.main').insertAdjacentElement('beforeend',file)
}

function ignoreTip(target){
    target.parentNode.removeChild(target)
    const orders_num = Array.from(document.querySelectorAll('.order')).length
    const files_num = Array.from(document.querySelectorAll('.file')).length
    if(orders_num == 0 && files_num == 0) document.querySelector('.close').click()
    else calculateHeight()
}

function calculateHeight(){
    const orders = Array.from(document.querySelectorAll('.order'))
    const orders_whole_height = orders.map(order => {
        return order.getClientRects()[0].height
    }).reduce((cur,pre) => cur + pre,0)
    const files = Array.from(document.querySelectorAll('.file'))
    const files_whole_height = files.map(file => {
        return order.getClientRects()[0].height
    }).reduce((cur,pre) => cur + pre,0)
    window.pre_api.reSetHeight(20 + orders_whole_height + files_whole_height + 5 * (orders.length + files.length))
}