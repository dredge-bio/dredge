"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , styled = require('styled-components').default

const LoadingWrapper = styled.div`
  position: absolute;
  color: red;
  font-size: 64px;
  top: 20%;
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

    this.timer = setTimeout(() => this.setState({ loading: false }), 400)
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

module.exports = LoadingIndicator;
