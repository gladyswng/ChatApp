
const socket = io()
// for accepting the event from the server
// the returned value from the io function needs to be stored in a var since we want to access it in this file

// Elements

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates

const messageTemplate = document.querySelector('#message-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // Only problem - this doesn't take into account the margin
    // We need to look at that new message element and figure out what that margin bottom we set was
    
    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container 
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    // scrollTop - gives us the number the amount of distance we've scrolled from the top

    if (containerHeight - newMessageHeight <= scrollOffset) {
        // this is to figure out if we've scrolled to the bottom before this message was added in

        // Here we want to make sure that we were indeed at the bottom before the last message was added

        // To auto scroll
        $messages.scrollTop = $messages.scrollHeight

    }





}


socket.on('message', (message) => {
    // the first name has to match the one in server
    // get the message data as the first arg in this func

    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locationMessage) => {

    const html = Mustache.render(urlTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //disable form when sending
    $messageFormButton.setAttribute('disabled', 'disabled') // set first to diabled and value

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {

        // enable to send after previous has been sent
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()


        if (error) {
            return console.log(error)

        }
        console.log('Message delivered!')
    })

})



$sendLocationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }


    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
    
        const { latitude, longitude } = position.coords

        socket.emit('sendLocation', {
            latitude, longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')

            console.log('location shared!')
        })
        
    })
})

socket.emit('join', { username, room }, error => {
    if (error) {
        alert(error)
        location.href = '/ '
    }
})