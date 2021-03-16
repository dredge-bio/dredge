"use strict";

import { Link } from 'org-shell'
import * as h from 'react-hyperscript'

function InternalLink(props: any) {
  return h('a', ...props)
}

const _InternalLink = Link(InternalLink)

export default _InternalLink
