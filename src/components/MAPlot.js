"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')

const LoadingWrapper = styled.div`
  position: absolute;
  color: red;
  font-size: 64px;
  top: 33%;
  left: 50%;
  transform: translate(-50%,0);
`

class LoadingIndicator extends React.Component {
  constructor(props) {
    super(props)

    this.startCountdown = this.startCountdown.bind(this)

    this.state = {
      loading: props.loading,
    }

    if (props.loading) this.startCountdown()
  }

  startCountdown() {
    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => this.setState({ loading: false }), 600)
  }

  componentDidUpdate(prevProps) {
    if (this.props.loading && !prevProps.loading) {
      this.setState({ loading: true })
      this.startCountdown()
    }
  }

  render() {
    const { loading } = this.state

    if (!loading) return null

    return (
      h(LoadingWrapper, [
        'Loading.....',
      ])
    )
  }
}

const PlotWrapper = styled.div`
  position: relative;
  height: 100%;
`

function Plot(props) {
  return (
    h(PlotWrapper, [
      'The plot',
      h(LoadingIndicator, {
        loading: props.loading,
      }),
    ])
  )
}

module.exports = connect(store => {
  return {
    loading: store.loading,
    view: store.currentView,
  }
})(Plot)
