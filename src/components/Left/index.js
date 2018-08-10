"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')

const LoadingWrapper = styled.div`
  position: absolute;
  color: red;
  font-size: 64px;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
`

class LoadingIndicator extends React.Component {
  constructor(props) {
    super(props)

    this.startCountdown = this.startCountdown.bind(this)

    this.state = {
      loading: props.loading
    }

    if (props.loading) this.startCountdown()
  }

  startCountdown() {
    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => this.setState({ loading: false }), 666)
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
        'Loading.....'
      ])
    )
  }
}

const LeftContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: ${props => props.height}px;
  width: ${props => props.width}px;
  background-color: lightblue;
`

function Left({ width, height, loading }) {
  return (
    h(LeftContainer, { width, height }, [
      h(LoadingIndicator, { loading }),
    ])
  )
}

module.exports = connect(
  R.pick(['loading'])
)(Left)
