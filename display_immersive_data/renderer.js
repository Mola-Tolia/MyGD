window.addEventListener('DOMContentLoaded',async () => {
    let divide = []
    let classify = []
    const day = 1000 * 60 * 60 * 24
    const e_hours = 1000 * 60 * 60 * 8
    const root = document.querySelector(':root')
    root.style.setProperty("--mode_list-display",'flex')
    window.pre_api.display_mode_list(() => {
        if(root.style.getPropertyValue("--mode_list-display") == 'flex'){
            root.style.setProperty("--mode_list-display",'none')
        }else{
            root.style.setProperty("--mode_list-display",'flex')
        }
    })
    new Array(25).fill('').forEach((div,index) => {
        div = document.createElement('div')
        const time_strip = document.querySelector('.time_strip')
        document.styleSheets[0].addRule(`.hour_point_${index}`,`
            position: absolute;
            height: 100%;
            top: 0;
            left: ${Math.floor((index / 24) * 10000) / 100}%;
            transform: translateX(-50%);
        `)
        div.classList.add(`hour_point_${index}`)
        div.innerText = index
        time_strip.insertAdjacentElement('beforeend',div)
    })
    window.pre_api.getAllData((results) => {
        divide = []
        classify = []
        Array.from(document.querySelectorAll('.time_item')).forEach(d => d.parentNode.removeChild(d))
        Array.from(document.querySelectorAll('.mode_item')).forEach(d => d.parentNode.removeChild(d))
        Array.from(document.querySelectorAll('.data_strip')).forEach(d => d.parentNode.removeChild(d))
        results.forEach(result => {
            if(Math.floor((result.start_time + e_hours) / day) == Math.floor((result.end_time + e_hours) / day)){
                divide.push(result)
            }else{
                const point = []
                const rest = (result.end_time + e_hours) % day
                let num = 0
                while((result.end_time + e_hours) - rest - day * num > (result.start_time + e_hours)){
                    point.push(result.end_time - rest - day * num)
                    num++
                }
                let start = result.start_time
                point.reverse()
                point.forEach(p => {
                    divide.push({mode:result.mode,start_time:start,end_time:p})
                    start = p
                })
                divide.push({mode:result.mode,start_time:start,end_time:result.end_time})
            }
        })
        divide.forEach(d => {
            const date = new Date(d.start_time)
            d.c = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
            if(!classify.includes(d.c)) classify.push(d.c)
        })
        classify = classify.map(c => {
            let arr = []
            divide.forEach(d => {
                if(c == d.c) arr.push(d)
            })
            return arr
        })
        const time_list = document.querySelector('.time_list')
        classify.forEach(c => {
            const time_item = document.createElement('div')
            time_item.classList.add('time_item')
            time_item.innerText = c[0].c
            time_list.insertAdjacentElement('beforeend',time_item)
            time_item.addEventListener('click',() => {
                Array.from(document.querySelectorAll('.time_item')).forEach(t => t.classList.remove('time_item_selected'))
                time_item.classList.add('time_item_selected')
                displayData(c)
            })
        })
        const dom = Array.from(document.querySelectorAll('.time_item'))[0]
        if(dom) dom.click()
    })
    document.querySelector('.show_data').addEventListener('mousemove',(e) => {
        let left = e.offsetX / document.querySelector('.show_data').getClientRects()[0].width
        left = Math.floor(left * 10000) / 100 + '%'
        root.style.setProperty("--time_line-width", left)
    })
})

function displayData(data){
    const type = []
    data.forEach(d => {
        if(!type.includes(d.mode)) type.push(d.mode)
    })
    const mode_list = document.querySelector('.mode_list')
    const show_data = document.querySelector('.show_data')
    Array.from(mode_list.querySelectorAll('.mode_item')).forEach(mi => mi.parentNode.removeChild(mi))
    Array.from(show_data.querySelectorAll('.data_strip')).forEach(ds => ds.parentNode.removeChild(ds))
    type.forEach((t,index) => {
        const arr = []
        data.forEach(d => {
            if(t == d.mode) arr.push(d)
        })
    const color = randomColor()
        document.styleSheets[0].addRule(`.bg_color_${index}`,`background-color: ${color}`)
        const mode_item = document.createElement('div')
        mode_item.classList.add('mode_item')
        mode_item.classList.add(`bg_color_${index}`)
        mode_item.innerText = arr[0].mode
        mode_list.insertAdjacentElement('beforeend',mode_item)
        document.styleSheets[0].addRule(`.bg_lg_${index}`,`background: linear-gradient(to right,${calLG(arr,color)})`)
        const data_strip = document.createElement('div')
        data_strip.classList.add('data_strip')
        data_strip.classList.add(`bg_lg_${index}`)
        data_strip.innerHTML = `<div>${calTotalTime(arr)}</div>`
        show_data.insertAdjacentElement('beforeend',data_strip)
    })
}

function randomColor(){
    const r = 180 + Math.floor(Math.random() * 76)
    const g = 180 + Math.floor(Math.random() * 76)
    const b = 180 + Math.floor(Math.random() * 76)
    return `rgb(${r},${g},${b})`
}

function calLG(arr,color){
    const day = 1000 * 60 * 60 * 24
    const e_hours = 1000 * 60 * 60 * 8
    const bg = 'rgb(255, 255, 255)'
    const color_arr = []
    arr.sort((a,b) => a.start_time - b.start_time)
    arr.map(t => {
        let start_p = Math.floor((((t.start_time + e_hours) % day) / day) * 10000) / 100
        let end_p = Math.floor((((t.end_time + e_hours) % day) / day) * 10000) / 100
        if(end_p == 0) end_p = 100
        // if(start_p == end_p) end_p = end_p + 0.01
        if(end_p - start_p < 0.05) end_p = start_p + 0.05
        color_arr.push(`${bg} ${start_p}%`)
        color_arr.push(`${color} ${start_p}%`)
        color_arr.push(`${color} ${end_p}%`)
        color_arr.push(`${bg} ${end_p}%`)
    })
    const color_str = color_arr.join(',')
    return color_str
}

function calTotalTime(arr){
    let time = 0
    arr.forEach(t => time += (t.end_time - t.start_time))
    const hours = Math.floor(time / 3600000)
    const minutes = Math.floor((time % 3600000) / 60000)
    const second = Math.floor(((time % 3600000) % 60000) /1000)
    let text = hours == 0 ? '' : hours + '小时'
    text = text + (text == '' ? (minutes == 0 ? '' : minutes + '分') : minutes + '分')
    text = text + second + '秒'
    return '总计' + text
}