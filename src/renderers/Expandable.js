import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import {submitEvent} from '../eventWrappers';
import {getNodeRenderOptions, updateNode} from '../selectors/nodes';
import {Renderer} from '../shapes/rendererShapes';
import {UPDATE_TYPE} from '../contants';

const Expandable = ({
  onChange,
  node,
  children,
  index,
  enableShiftClick = false,
  iconsClassNameMap = {
    expanded: 'mi mi-keyboard-arrow-down',
    collapsed: 'mi mi-keyboard-arrow-right',
    lastChild: '',
  },
}) => {
  const {hasChildren, isExpanded} = getNodeRenderOptions(node);
  const className = classNames({
    [iconsClassNameMap.expanded]: hasChildren && isExpanded,
    [iconsClassNameMap.collapsed]: hasChildren && !isExpanded,
    [iconsClassNameMap.lastChild]: !hasChildren,
  });

  const handleChange = e => {
    if (enableShiftClick && e.shiftKey) {
      onChange({
        node: {...node, state: {...node.state, expanded: !isExpanded}},
        type: isExpanded ? UPDATE_TYPE.COLLAPSE_RECURSIVELY : UPDATE_TYPE.EXPAND_RECURSIVELY,
        index,
      });
    } else {
      onChange({...updateNode(node, {expanded: !isExpanded}), index});
    }
  };

  return (
    <span onDoubleClick={handleChange}>
      {hasChildren && (
        <i tabIndex={0} onKeyDown={submitEvent(handleChange)} onClick={handleChange} className={className} />
      )}
      {children}
    </span>
  );
};

Expandable.propTypes = {
  ...Renderer,
  iconsClassNameMap: PropTypes.shape({
    expanded: PropTypes.string,
    collapsed: PropTypes.string,
    lastChild: PropTypes.string,
  }),
};

export default Expandable;
