
const deleteBtns = document.querySelectorAll(".delete");
deleteBtns.forEach((btn) => {
    btn.addEventListener("click", async(e : any) => {

        await fetch(`${window.location}/rewards/` + btn.parentElement?.parentElement?.parentElement?.id, {
            method: "DELETE",
        })
        console.log(btn.parentElement?.parentElement?.id)
        e.target?.parentElement.parentElement.parentElement.remove();
    });
});

const updateUserBtn = document.querySelector("#updateUserButton");
updateUserBtn?.addEventListener("click", async(e : any) => {
    e.preventDefault();

    const updateForm = new FormData(document.querySelector("#updateUserForm") as HTMLFormElement);
    const data: {
        [key: string]: any;
      } = {}
      
    for (const [key, value] of updateForm.entries()) {
        data[key] = value;
    }

    await fetch(`${window.location}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })

    return window.location.reload();
});