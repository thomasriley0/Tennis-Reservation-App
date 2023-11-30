let menu_wrapper = document.querySelector(".navWrapper");
let menu_popup = document.querySelector(".nav-popup");
let menu_button = document.querySelector(".menu-button");
let close_button = document.querySelector(".close-button");
let navContainer = document.querySelector(".nav");
let hamburger = document.querySelector(".menu-button")
let body = document.querySelector("body")
let menuToggle = false

menu_button.addEventListener("click", function () {
  menu_popup.classList.toggle("closed");
  body.classList.toggle("overflowHidden")
  if (!menuToggle) {
    hamburger.src = "/img/close.svg"
    menuToggle = true
  } else {
    hamburger.src = "/img/menu.svg"
    menuToggle = false

  }
});