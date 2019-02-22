"use strict";

module.exports = {
  Button: {
    fontSize: '14px',
    padding: '6px 12px',
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid #666',
    cursor: 'pointer',

    '&:hover:not(:disabled)': {
      backgroundColor: '#f0f0f0',
    },

    '&:disabled': {
      opacity: .5,
      cursor: 'not-allowed',
    },
  },
}
