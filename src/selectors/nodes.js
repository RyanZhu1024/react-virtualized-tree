import {createSelector} from 'reselect';
import omit from 'lodash.omit';
import findIndex from 'lodash.findindex';

import {UPDATE_TYPE} from '../contants';

export {getFlattenedTree} from './getFlattenedTree';

export const getNodeRenderOptions = createSelector(
  node => (node.state || {}).expanded,
  node => (node.state || {}).favorite,
  node => (node.state || {}).deletable,
  node => node.children,
  (expanded, favorite, deletable, children = []) => ({
    hasChildren: !!children.length,
    isExpanded: !!expanded,
    isFavorite: !!favorite,
    isDeletable: !!deletable,
  }),
);

const FLATTEN_TREE_PROPERTIES = ['deepness', 'parents'];

const NODE_OPERATION_TYPES = {
  CHANGE_NODE: 'CHANGE_NODE',
  EXPAND_NODE_RECURSIVELY: 'EXPAND_NODE_RECURSIVELY',
  COLLAPSE_NODE_RECURSIVELY: 'COLLAPSE_NODE_RECURSIVELY',
  DELETE_NODE: 'DELETE_NODE',
};

const NODE_CHANGE_OPERATIONS = {
  CHANGE_NODE: (nodes, updatedNode) =>
    nodes.map(
      n =>
        n.id === updatedNode.id
          ? omit({...updatedNode, ...(n.children && {children: [...n.children]})}, FLATTEN_TREE_PROPERTIES)
          : n,
    ),
  EXPAND_NODE_RECURSIVELY: (nodes, updatedNode) =>
    nodes.map(
      n =>
        n.id === updatedNode.id
          ? omit(
              {
                ...updatedNode,
                ...(n.children && {
                  children: [...n.children.map(child => _recursivelyUpdateNode(child, {expanded: true}))],
                }),
              },
              FLATTEN_TREE_PROPERTIES,
            )
          : n,
    ),
  COLLAPSE_NODE_RECURSIVELY: (nodes, updatedNode) =>
    nodes.map(
      n =>
        n.id === updatedNode.id
          ? omit(
              {
                ...updatedNode,
                ...(n.children && {
                  children: [...n.children.map(child => _recursivelyUpdateNode(child, {expanded: false}))],
                }),
              },
              FLATTEN_TREE_PROPERTIES,
            )
          : n,
    ),
  DELETE_NODE: (nodes, updatedNode) => nodes.filter(n => n.id !== updatedNode.id),
};

export const expandNodeFromTreeRecursively = (nodes, updatedNode) => {
  return replaceNodeFromTree(nodes, updatedNode, NODE_OPERATION_TYPES.EXPAND_NODE_RECURSIVELY);
};

export const collapseNodeFromTreeRecursively = (nodes, updatedNode) => {
  return replaceNodeFromTree(nodes, updatedNode, NODE_OPERATION_TYPES.COLLAPSE_NODE_RECURSIVELY);
};

export const replaceNodeFromTree = (nodes, updatedNode, operation = NODE_OPERATION_TYPES.CHANGE_NODE) => {
  if (!NODE_CHANGE_OPERATIONS[operation]) {
    return nodes;
  }

  const {parents} = updatedNode;

  if (!parents.length) {
    return NODE_CHANGE_OPERATIONS[operation](nodes, updatedNode);
  }

  const parentIndex = findIndex(nodes, n => n.id === parents[0]);
  const preSiblings = nodes.slice(0, parentIndex);
  const postSiblings = nodes.slice(parentIndex + 1);

  return [
    ...preSiblings,
    {
      ...nodes[parentIndex],
      ...(nodes[parentIndex].children
        ? {
            children: replaceNodeFromTree(
              nodes[parentIndex].children,
              {...updatedNode, parents: parents.slice(1)},
              operation,
            ),
          }
        : {}),
    },
    ...postSiblings,
  ];
};

export const deleteNodeFromTree = (nodes, deletedNode) => {
  return replaceNodeFromTree(nodes, deletedNode, NODE_OPERATION_TYPES.DELETE_NODE);
};

export const updateNode = (originalNode, newState) => ({
  node: {
    ...originalNode,
    state: {
      ...originalNode.state,
      ...newState,
    },
  },
  type: UPDATE_TYPE.UPDATE,
});

export const _recursivelyUpdateNode = (originalNode, newState) => {
  const {children = [], state, ...rest} = originalNode;
  let node = {
    ...rest,
    state: {
      ...state,
      ...newState,
    },
  };
  if (children.length > 0) {
    node.children = children.map(childNode => _recursivelyUpdateNode(childNode, newState));
  }
  return node;
};

export const deleteNode = node => ({
  node,
  type: UPDATE_TYPE.DELETE,
});

export const addNode = node => ({
  node,
  type: UPDATE_TYPE.ADD,
});

export const getRowIndexFromId = (flattenedTree, id) => findIndex(flattenedTree, node => node.id === id);

/**
 * Gets a node in the original tree from a provided path.
 *
 * @param {number|string[]} path - The id path to the node
 * @param {Object[]} tree - The Original tree
 */
export const getNodeFromPath = (path, tree) => {
  let node;
  let nextLevel = tree;

  if (!Array.isArray(path)) {
    throw new Error('path is not an array');
  }

  for (let i = 0; i < path.length; i++) {
    const id = path[i];

    let nextNode = nextLevel.find(n => n.id === id);

    if (!nextNode) {
      throw new Error(`Could not find node at ${path.join(',')}`);
    }

    if (i === path.length - 1 && nextNode.id === id) {
      node = nextNode;
    } else {
      nextLevel = nextNode.children;
    }
  }

  if (!node) {
    throw new Error(`Could not find node at ${path.join(',')}`);
  }

  return node;
};
