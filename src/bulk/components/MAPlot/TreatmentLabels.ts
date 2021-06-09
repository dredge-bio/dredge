import styled from 'styled-components'
import padding from './padding'

const TreatmentLabels = styled.div`
position: absolute;
left: ${padding.l - 26}px;
right: 172px;
white-space: nowrap;
padding-bottom: 9px;
padding-left: 26px;

&:hover {
  z-index: 2;
  background-color: hsla(45,31%,93%,1);
  padding-right: 1em;
  overflow: unset;
  right: unset;
}

> div {
  font-family: SourceSansPro;
  font-weight: bold;
  font-size: 20px;

  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

> div:hover {
  width: unset;
  overflow:  unset;
  text-overflow:  unset;
}

> span {
  position: absolute;
  left: 0;
  top: 28px;
  font-family: SourceSansPro;
  font-weight: bold;
  font-size: 16px;
  color: #888;
}
`

export default TreatmentLabels
