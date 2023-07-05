(function () {
    const timelines = document.querySelectorAll('.js-hidden-scroll');

    if (!timelines.length) {
        return false;
    }

    timelines.forEach((timeline) => {
        timeline.onmousedown = () => {
            let pageX = 0;

            document.onmousemove = (e) => {
                if (pageX !== 0) {
                    timeline.scrollLeft =
                        timeline.scrollLeft + (pageX - e.pageX);
                }
                pageX = e.pageX;
            };

            window.onmouseup = () => {
                document.onmousemove = null;
                timeline.onmouseup = null;
            };

            timeline.ondragstart = () => false;
        };
    });
})();
