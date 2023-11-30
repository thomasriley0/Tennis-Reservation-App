function validateForm() {
    if (/^\d{5}(-\d{4})?$/.test(document.getElementById("zip").value) || document.getElementById("zip").value == "") {
        document.getElementById("zipError").classList.add("hidden")
        document.getElementById("parkSearchForm").submit()
    } else {
        document.getElementById("zipError").classList.remove("hidden")
        return false;
    }
}