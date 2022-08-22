import axios from "axios";

const deleteBtns = document.querySelectorAll(".delete");
// Add listener for each button in deleteBtns array. When clicked, delete the parent's parent.
deleteBtns.forEach((btn) => {
    btn.addEventListener("click", async(e : any) => {
        console.log("Click")
        await axios.delete(`/${window.location.pathname}/rewards/` + btn.parentElement?.parentElement?.id);
        e.target?.parentElement.parentElement.remove();
    });
});