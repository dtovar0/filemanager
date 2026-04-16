document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;

    const action = trigger.getAttribute('data-action');

    if (action === 'close-admin-platform-modal') {
        if (window.closeModal) window.closeModal('platformModal');
        return;
    }
});
