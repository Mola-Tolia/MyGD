window.addEventListener('DOMContentLoaded',async () => {
    const password = document.querySelector('.password')
    const submit = document.querySelector('.submit')
    const username = document.querySelector('.username')
    document.querySelector('.login').addEventListener('click',() => {
        password.type = 'password'
        submit.innerText = '登录'
    })
    document.querySelector('.register').addEventListener('click',() => {
        password.type = 'text'
        submit.innerText = '注册'
    })
    submit.addEventListener('click',() => {
        if(submit.innerText === '登录'){
            window.pre_api.login({username:username.value,password:password.value})
        }else{
            window.pre_api.register({username:username.value,password:password.value})
        }
    })
    document.querySelector('.close').addEventListener('click',() => {
        window.pre_api.quit()
    })
})
