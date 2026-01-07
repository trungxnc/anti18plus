document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('goBackBtn').addEventListener('click', () => {
        history.back();
    });

    document.getElementById('reportBtn').addEventListener('click', () => {
        alert('Reporting feature coming soon!');
    });
});
