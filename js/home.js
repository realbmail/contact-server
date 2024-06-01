document.addEventListener("DOMContentLoaded", initHomePage);
async function initHomePage() {
    await initDatabase();

    window.addEventListener('hashchange', function () {
        showView(window.location.hash, actionFilter);
    });
    showView(window.location.hash || '#onboarding/welcome', actionFilter);
    window.navigateTo = navigateTo;
}

function navigateTo(hash) {
    history.pushState(null, null, hash);
    showView(hash, actionFilter);
}

function actionFilter(){

}