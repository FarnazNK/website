document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for navigation links with in-page anchors
    document.querySelectorAll('a.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetPage = this.getAttribute('href');

            // Apply smooth scroll only if the link is an in-page anchor (starts with '#')
            if (targetPage && targetPage.startsWith('#')) {
                e.preventDefault();
                const targetId = targetPage.substring(1); // Remove the # symbol
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    console.log('Portfolio website interactions ready');
});

function toggleDetails(card) {
    const details = card.querySelector('.details-content, .skill-details, .resume-details, .experience-details');
    if (details) {
        details.classList.toggle('show');
        if (details.classList.contains('show')) {
            details.style.display = 'block';
        } else {
            details.style.display = 'none';
        }
    }
}

