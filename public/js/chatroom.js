function openForm() {
  document.getElementById("chat-room").style.display = "flex";
  document.getElementById("open-btn").style.display = "none";
  $('#messages').scrollTop($('#messages').prop('scrollHeight'));
}

function closeForm() {
  document.getElementById("chat-room").style.display = "none";
  document.getElementById("open-btn").style.display = "block";
}

let localUser;
let localService;
window.addEventListener("DOMContentLoaded", socketConnect);

function socketConnect () {
  const socket = io();
  const userToken = app.user.getAccessToken()
  if(userToken){
    socket.emit('user connect', { userToken });
  }else{
    socket.emit('user connect', { });
  }
  socket.on('user connect', ({ user, service })=>{
    localUser = user;
    localService = service;
    // Create history message
    if( user.history.length > 0){
      user.history.map((m)=>{
        if(m.send === user.id){
          $('#messages').append($('<p>').text( m.msg ).addClass('user'));
        }else{
          $('#messages').append($('<p>').text( m.msg ).addClass('other'));
        }
      })
    }
  })

  socket.on('chat message', ({send, receive, msg}) => {
    if(localUser){
      if(send.id === localUser.id){
      $('#messages').append($('<p>').text( msg ).addClass('user'));
      }else{
      $('#messages').append($('<p>').text( msg ).addClass('other'));
      }
      $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
  });
  
  $('form').submit(function(e){
    e.preventDefault(); // prevents page reloading
    const msg = $('#m').val()
    if(msg != null && msg != ''){
      socket.emit('chat message', { send: localUser, receive: localService, msg});
      $('#m').val('');
    }
    return false;
  });
};