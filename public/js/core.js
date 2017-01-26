$(document).ready(function(){
  $('#button').click(function(){
      var likeBook = $(this).attr('class')
      $.ajax({
        url:'api/books/'+likeBook
      })
      .done(function(data){
        console.log(data);
      });
      $(this).toggleClass("clicked")
    })
  });
