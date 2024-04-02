window.addEventListener('DOMContentLoaded',async () => {
    toCertainPhase(1)
    const root = document.querySelector(':root')
    root.style.setProperty("--choose_mode_bg-left", '0')
    document.querySelector('.first_phase').addEventListener('click',() => {
        if(current_phase == 1) toCertainPhase(2)
    })
    document.querySelector('.choose_mode_1').addEventListener('mousemove',() => {
        root.style.setProperty("--choose_mode_bg-left", '0')
    })
    document.querySelector('.choose_mode_2').addEventListener('mousemove',() => {
        root.style.setProperty("--choose_mode_bg-left", '20%')
    })
    document.querySelector('.choose_mode_3').addEventListener('mousemove',() => {
        root.style.setProperty("--choose_mode_bg-left", '40%')
    })
    document.querySelector('.choose_mode_4').addEventListener('mousemove',() => {
        root.style.setProperty("--choose_mode_bg-left", '60%')
    })
    document.querySelector('.choose_mode_5').addEventListener('mousemove',() => {
        root.style.setProperty("--choose_mode_bg-left", '80%')
    })
    document.querySelector('.choose_mode_5').addEventListener('click',() => {
        if(current_phase == 2) toCertainPhase(3)
    })
    document.querySelector('.choose_mode_1').addEventListener('click',() => {
        if(current_phase == 2){
            mode_name = '工作'
            toCertainPhase(4)
            setModeName()
        }
    })
    document.querySelector('.choose_mode_2').addEventListener('click',() => {
        if(current_phase == 2){
            mode_name = '学习'
            toCertainPhase(4)
            setModeName()
        }
    })
    document.querySelector('.choose_mode_3').addEventListener('click',() => {
        if(current_phase == 2){
            mode_name = '编程'
            toCertainPhase(4)
            setModeName()
        }
    })
    document.querySelector('.choose_mode_4').addEventListener('click',() => {
        if(current_phase == 2){
            mode_name = '创作'
            toCertainPhase(4)
            setModeName()
        }
    })
    document.querySelector('.third_phase_input').addEventListener('keydown',(event) => {
        if(event.key === 'Enter' && event.target.value.trim() != '' && current_phase == 3){
            mode_name = event.target.value.trim()
            toCertainPhase(4)
            setModeName()
        }
    })
    document.querySelector('.hide').addEventListener('click',() => {
        window.pre_api.hide()
    })
    document.querySelector('.end').addEventListener('click',() => {
        window.pre_api.end(id).then(time => {
            const hours = Math.floor(time / 3600000)
            const minutes = Math.floor((time % 3600000) / 60000)
            const second = Math.floor(((time % 3600000) % 60000) /1000)
            let text = hours == 0 ? '' : hours + '小时'
            text = text + (text == '' ? (minutes == 0 ? '' : minutes + '分') : minutes + '分')
            text = text + second + '秒'
            document.querySelector('.time').innerText = text
            toCertainPhase(6)
        })
    })
    window.pre_api.press_enter(() => {
        if(current_phase == 1) toCertainPhase(2)
        else if(current_phase == 2){
            const left = root.style.getPropertyValue('--choose_mode_bg-left')
            switch(left){
                case '0':
                    mode_name = '工作'
                    break
                case '20%':
                    mode_name = '学习'
                    break
                case '40%':
                    mode_name = '编程'
                    break
                case '60%':
                    mode_name = '创作'
                    break
                case '80%':
                    toCertainPhase(3)
            }
            if(left != '80%'){
                toCertainPhase(4)
                setModeName()
            }
        }else if(current_phase == 3){
            if(document.querySelector('.third_phase_input').value.trim() != ''){
                mode_name = document.querySelector('.third_phase_input').value.trim()
                toCertainPhase(4)
                setModeName()
            }
        }else if(current_phase == 5) document.querySelector('.hide').click()
        else if(current_phase == 6) window.pre_api.hide()
    })
    window.pre_api.press_esc(() => {
        if(current_phase == 1) window.pre_api.hide()
        else if(current_phase == 2) toCertainPhase(1)
        else if(current_phase == 3) toCertainPhase(2)
        else if(current_phase == 5) document.querySelector('.end').click()
        else if(current_phase == 6) window.pre_api.hide()
    })
    window.pre_api.press_right(() => {
        if(current_phase == 2){
            const left = root.style.getPropertyValue('--choose_mode_bg-left')
            switch(left){
                case '0':
                    root.style.setProperty("--choose_mode_bg-left", '20%')
                    break
                case '20%':
                    root.style.setProperty("--choose_mode_bg-left", '40%')
                    break
                case '40%':
                    root.style.setProperty("--choose_mode_bg-left", '60%')
                    break
                case '60%':
                    root.style.setProperty("--choose_mode_bg-left", '80%')
                    break
                case '80%':
                    root.style.setProperty("--choose_mode_bg-left", '0')
            }
        }
    })
    window.pre_api.press_left(() => {
        if(current_phase == 2){
            const left = root.style.getPropertyValue('--choose_mode_bg-left')
            switch(left){
                case '0':
                    root.style.setProperty("--choose_mode_bg-left", '80%')
                    break
                case '20%':
                    root.style.setProperty("--choose_mode_bg-left", '0')
                    break
                case '40%':
                    root.style.setProperty("--choose_mode_bg-left", '20%')
                    break
                case '60%':
                    root.style.setProperty("--choose_mode_bg-left", '40%')
                    break
                case '80%':
                    root.style.setProperty("--choose_mode_bg-left", '60%')
            }
        }
    })
    window.pre_api.reset(() => {
        toCertainPhase(1)
        document.querySelector('.third_phase_input').value = ''
    })
})

let current_phase = 0,mode_name = '',id
function toCertainPhase(value){
    window.pre_api.setCurrentPhase(value)
    current_phase = value
    const root = document.querySelector(':root')
    root.style.setProperty("--first_phase-display", 'none')
    root.style.setProperty("--second_phase-display", 'none')
    root.style.setProperty("--third_phase-display", 'none')
    root.style.setProperty("--fourth_phase-display", 'none')
    root.style.setProperty("--fifth_phase-display", 'none')
    root.style.setProperty("--sixth_phase-display", 'none')
    const arr = ['first','second','third','fourth','fifth','sixth']
    root.style.setProperty(`--${arr[value - 1]}_phase-display`, 'flex')
    if(value == 4){
        setTimeout(() => {
            id = new Date().getTime()
            window.pre_api.startToRecord(mode_name,id)
            toCertainPhase(5)
        },2000)
    }
    if(value == 3){
        document.querySelector('.third_phase_input').focus()
    }
}

function setModeName(){
    document.querySelector('.mode_name').innerText = mode_name
    document.querySelector('.mode_name_2').innerText = mode_name
    document.querySelector('.mode_name_3').innerText = mode_name
}