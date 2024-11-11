const swiper = new Swiper('.swiper', {
    // Optional parameters
    effect: "coverflow",
    grabCursor: true,
    spaceBetween: 20,
    centeredSlides: true,
    speed: 200,
    preventClicks: true,
    slidesPerView: "auto",
    coverflowEffect: {
        rotate: 0,
        stretch: 50,
        depth: 350,
        modifier: 1,
    },
  
    // If we need pagination
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true
    },
  
    // Navigation arrows
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
  });