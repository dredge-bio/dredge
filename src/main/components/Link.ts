"use strict";

import { Link } from 'org-shell'
import { createElement as h } from 'react'

function InternalLink(props: any) {
  return h('a', ...props)
}

const _InternalLink = Link(InternalLink)

export default _InternalLink
