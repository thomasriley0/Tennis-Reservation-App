let menu_popup = document.querySelector(".nav-popup");
let menu_button = document.querySelector(".menu-button");
let close_button = document.querySelector(".close-button");
let navContainer = document.querySelector(".nav");

menu_button.addEventListener("click", function () {
  menu_popup.classList.toggle("closed");
  navContainer.classList.toggle("closed");
});

close_button.addEventListener("click", function () {
  menu_popup.classList.toggle("closed");
  navContainer.classList.toggle("closed");
});
