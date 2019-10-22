// slidesToShow
// slidesToScroll
// responsive[]
// - breakpoint: number
// - settings:  object
// - settings.slideToShow: number
// - settings.slideToScroll: number
// TODO: add navigation indicators
import debounce from 'lodash.debounce'

const createButton = (className, icon) => {
  const icons = icon.split(' ')
  const button = document.createElement('button')
  button.classList.add(className)
  const iconElement = document.createElement('i')
  iconElement.classList.add(...icons)
  button.appendChild(iconElement)
  return button
}

/**
 * @property {object} errors
 * @property {number} index
 */
export default class CarouselSlider {
  /**
   * @param {object} options
   * @param {string} [options.selector]
   * @param {HTMLElement} [options.container]
   * @param {object} [options.pages]
   * @param {number} [options.pages.onSmall]
   * @param {number} [options.pages.onMedium]
   * @param {number} [options.pages.onLarge]
   * @param {string} [options.previousButtonClass]
   * @param {string} [options.nextButtonClass]
   * @param {boolean} [options.infinite]
   * @param {number} [options.slidesVisible]
   * @param {number} [options.slidesToScroll]
   * @param {string} [options.elementSize]
   * @param {string} [options.wrapperSelector]
   * @param {{breakpoint: number, settings: object}[]} [options.responsive]
   */
  constructor (options) {
    const defaultOptions = {
      infinite: false,
      previousButtonClass: 'carousel-previous',
      previousButtonClassIcon: 'fa fa-chevron-left',
      nextButtonClass: 'carousel-next',
      nextButtonClassIcon: 'fa fa-chevron-right',
      carouselSetClass: 'carousel-set',
      indicatorsClass: 'carousel-indicators',
      slidesVisible: 1,
      slidesToScroll: 1,
      responsive: []
    }
    this.options = Object.assign({}, defaultOptions, options)
    this._options = Object.assign({}, this.options)
    this.options.elementSize = Math.round(100 / this.options.slidesVisible).toFixed(2) + '%'
    if (typeof this.options.container === 'string') {
      this.options.container = document.querySelector(this.options.container)
    }
    if (!this.options.container) {
      this.options.container = document.body
    }
    this.$elements = this.options.container.querySelectorAll(this.options.selector)
    // check if carousel not already set. Yes code should be idempotent
    if (!this.requirementsAreMet()) {
      throw new Error('[CarouselSlider] Missing parameters: ' + JSON.stringify(this.errors))
    }
    if (this.options.container.classList.contains(this.options.carouselSetClass)) {
      console.warn(`[CarouselSlider::CarouselSlider] container %s have carousel slider already set`, this.options.container)
      return
    }
    this.$nextButton = null
    this.$previousButton = null
    this.$wrapper = this.options.container.querySelector(this.options.wrapperSelector)
    this.addNavigationButtons()
    // TODO: this.addDotIndicators()
    this.index = 0
    this.setUpResponsive()
    this.init(this.options)
    this.setAccessibilities()
    this.options.container.classList.add(this.options.carouselSetClass)
  }

  init () {
    this.pageCount = Math.ceil(this.$elements.length / this.options.slidesVisible)
    // console.log('elements: %s, slides visible: %s, page count is now %s. Going to slide index %s',
    // this.$elements, this.options.slidesVisible, this.pageCount, this.index)
    this.goToSlide(this.index)
    this.setStyle()
  }

  addNavigationButtons () {
    if (!this.$wrapper) {
      console.warn(`[CarouselSlider::addNavigationButtons] No options.wrapperSelector found for value: ${this.options.wrapperSelector}`)
      return false
    }
    this.$nextButton = this.$wrapper.querySelector(this.options.nextButtonClass)
    if (!this.$nextButton) {
      this.$nextButton = createButton(this.options.nextButtonClass, this.options.nextButtonClassIcon)
      this.$nextButton.addEventListener('click', () => this.next())
      this.options.container.append(this.$nextButton)
    }
    this.$previousButton = this.$wrapper.querySelector(this.options.previousButtonClass)
    if (!this.$previousButton) {
      this.$previousButton = createButton(this.options.previousButtonClass, this.options.previousButtonClassIcon)
      this.$previousButton.addEventListener('click', () => this.previous())
      this.options.container.append(this.$previousButton)
    }
  }

  setAccessibilities () {
    // TODO: make idempotent
    this.options.container.addEventListener('keyup', debounce((e) => {
      if (e.key === 'ArrowRight') {
        this.next()
      }
      if (e.key === 'ArrowLeft') {
        this.previous()
      }
    }))
  }

  addDotIndicators () {
    this.indicators = []
    const list = document.createElement('ul')
    this.$elements.forEach(($element, index) => {
      const indicator = document.createElement('li')
      this.indicators.push(indicator)
      list.append(indicator)
    })
    list.classList.add(this.options.indicatorsClass)
    this.options.container.appendChild(list)
  }

  requirementsAreMet () {
    this.errors = {}
    if (!this.options.selector) {
      this.errors['selector'] = 'Selector parameter is missing'
    }

    return Object.keys(this.errors).length === 0
  }

  setStyle () {
    // no need of the line below since we are using flex
    // const ratio = this.$elements.length / this.options.slidesVisible
    // this.$wrapper.style.width = (ratio * 100) + '%'
    // this.$elements.forEach($element => $element.style.width = ((100 / this.options.slidesVisible) / ratio) + '%')

    // flex method
    this.$elements.forEach($element => $element.style.flex = '0 0 ' + (100 / this.options.slidesVisible) + '%')
  }

  setUpResponsive () {
    // const applyMedia = (media, params) => {
    //   if (media.matches) {
    //     console.log('computing with params %o', params)
    //   }
    // }
    // this.options.responsive.forEach(option => {
    //   const mediaQuery = window.matchMedia(`@media only screen and (min-width: ${option.breakpoint}px)`)
    //   applyMedia(mediaQuery, option.settings)
    //   mediaQuery.addListener(media => applyMedia(media, option.settings))
    // })
    // TODO: make idempotent
    this.resizeHandler = debounce((e) => {
      // find the greater media query matching
      let medias = this.options.responsive.filter(option => option.breakpoint <= window.innerWidth)
      if (medias.length === 0) {
        // console.log('no media found matching %s', window.innerWidth)
        if (JSON.stringify(this._options) !== JSON.stringify(this.options)) {
          // console.log('applied options are not the one received. resetting')
          this.options = JSON.parse(JSON.stringify(this._options))
          this.init()
        }
        return false
      }
      // sort by breakpoint DESC
      medias = medias.sort((mediaA, mediaB) => mediaB.breakpoint - mediaA.breakpoint)
      if (medias[0]) {
        this.options = Object.assign({}, this.options, medias[0].settings)
        this.init()
      }
    }, 500)
    window.addEventListener('resize', this.resizeHandler)
    this.resizeHandler()
  }

  goToSlide (index) {
    // if (this.indicators[this.index]) {
    //   this.indicators[this.index].classList.remove('active')
    // }
    let step = this.$elements.length - this.options.slidesVisible
    if (step < 0) {
      step = 1
    }
    if (index < 0) {
      this.index = this.options.infinite ? step : 0
    } else if (index >= this.$elements.length || (!this.$elements[this.index + this.options.slidesVisible] && index > this.index)) {
      this.index = this.options.infinite ? 0 : step
    } else {
      this.index = index
    }
    // this.indicators[this.index].classList.add('active')
    const value = -this.index * 100 / this.options.slidesVisible
    this.$wrapper.style.transform = `translate3d(${value}%, 0, 0)`
    // console.log('has slide before: %s %o, has slide after: %s %o', this.hasSlideBefore, this.$previousButton, this.hasSlideAfter, this.$nextButton)
    this.$previousButton.style.display = !this.hasSlideBefore ? 'none' : 'block'
    this.$nextButton.style.display = !this.hasSlideAfter ? 'none' : 'block'
    if (this.options.infinite) {
      return false
    }
  }

  get hasSlideBefore () {
    return this.index > 0
  }

  get hasSlideAfter () {
    return this.index + this.options.slidesVisible < this.$elements.length - 1
  }

  next () {
    this.goToSlide(this.index + this.options.slidesToScroll)
  }

  previous () {
    this.goToSlide(this.index - this.options.slidesToScroll)
  }

  // onResize () {
  //   return debounce(_ => {
  //     if (window.innerWidth <= this.options.pages.onSmall) {
  //       return false
  //     }
  //   }, 400)
  // }

  dispose () {
    window.removeEventListener('resize', this.resizeHandler)
    // TODO: remove keyup listener. @see setAccessibilities
    // TODO: remove dot indicator
  }
}
