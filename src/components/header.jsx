"use strict";

var React = require('react')
  , Header

Header = () => (
  <header className="px2 flex flex-justify" style={{
    height: '40px',
    lineHeight: '40px',
    color: 'white',
    backgroundColor: '#370a00',
    borderBottom: '1px solid #ccc',
    boxSizing: 'border-box'
  }}>
    <div style={{
      fontSize: '18px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>
      Interactive visualizer of differential gene expression in the early <i>C. elegans</i> embryo
    </div>

    <div>
      <a href="#" className="bold white">
        About
      </a>
    </div>
  </header>
)

module.exports = Header;
