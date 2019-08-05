# Carousel slider
- vanilla js. dependency free
- responsive - provide your own breakpoint with appropriate settings based on screen size
- fully customizable
- provide your own styling

Below is a sample code of how I am using it with @vuejs
```js
const carousel = new CarouselSlider({
        container: this.$el.querySelector('.js-fare-options'),
        wrapperSelector: '.js-fare-options-wrapper',
        selector: '[data-fare-option]',
        previousButtonClass: 'fare-option-previous',
        nextButtonClass: 'fare-option-next',
        slidesVisible: 1,
        responsive: [{
          breakpoint: 680,
          settings: {
            slidesVisible: 1
          }
        }, {
          breakpoint: 900,
          settings: {
            slidesVisible: 2
          }
        }, {
          breakpoint: 1200,
          settings: {
            slidesVisible: 3
          }
        }]
      })
      this.$once('hook:destroyed', () => {
        carousel.dispose()
      })
```


# Contributing
Please check the todo file before submitting your pull request. 

# [TODO](TODO.md)
