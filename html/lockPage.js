add_book()
{
  var bookTitle = document.getElementById("bookTitle").value;
  var bookType = document.getElementById("bookType").value;

  $.post("./getBooks.php",
    {
        action: "add_book",
        BookTitle: bookTitle,
        BookType: bookType
    },
    function(data, status){
        //alert("Book Added!\n" + data);
        var to_be_library = JSON.parse(data);
        library.assembleLibrary(to_be_library);
    });
}
