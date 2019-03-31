"use strict";

module.exports = {
  space: [
    0, 4, 8, 16, 32, 64, 128, 256
  ],
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
