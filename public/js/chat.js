const socket=io()
const $messageForm=document.querySelector('#message-form')
const $messageFormInput= $messageForm.querySelector('input')
const $messageFormButton= $messageForm.querySelector('button')
const $locationButton=document.querySelector('#send-location')
const $messages= document.querySelector('#messages')


//templates
const messageTemplate= document.querySelector('#message-template').innerHTML
const locationUrlTemplate= document.querySelector('#locationUrl-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML
//options
const {username, room}= Qs.parse(location.search, {ignoreQueryPrefix:true})


const autoscroll= ()=>{
    //new message element
    const $newMessage= $messages.lastElementChild

    //height of new message 
    const newMessageStyle= getComputedStyle($newMessage)
    const newMessageMargin= parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    //visible Height
    const visibleheight =$messages.offsetHeight

    //Height of message container 
    const containerHeight= $messages.scrollHeight

    //How far have i scrolled
    const scrollOffset= $messages.scrollTop + visibleheight

    if(containerHeight-newMessageHeight <= scrollOffset){
        $messages.scrollTop= $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html= Mustache.render(messageTemplate,{username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(url)=>{
    console.log(url)
    const html= Mustache.render(locationUrlTemplate,{username: url.username, url: url.url, createdAt:moment(url.createdAt).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html= Mustache.render(sidebarTemplate,{room,users})
    console.log(room)
    console.log(users)
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')

    const message=document.querySelector("input[name='message']").value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('message delivered')
    })
}) 

$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('geolocation is not supoorted by your browser')
    }

    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
       
       socket.emit('sendPosition',{latitude:position.coords.latitude, longitude:position.coords.longitude},()=>{
        $locationButton.removeAttribute('disabled')
        console.log('location shared')
    })
    })
})

socket.emit('join', {username, room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})