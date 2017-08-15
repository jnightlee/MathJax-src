/*************************************************************
 *
 *  Copyright (c) 2017 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * @fileoverview  Implements the CHTML OutputJax object
 *
 * @author dpvc@mathjax.org (Davide Cervone)
 */

import {AbstractOutputJax} from '../core/OutputJax.js';
import {OptionList} from '../util/Options.js';
import {MathDocument} from '../core/MathDocument.js';
import {MathItem} from '../core/MathItem.js';
import {MmlNode} from '../core/MmlTree/MmlNode.js';
import {HTMLNodes} from '../util/HTMLNodes.js';
import {CHTMLWrapper} from './chtml/Wrapper.js';
import {CHTMLWrapperFactory} from './chtml/WrapperFactory.js';
import {FontData} from './chtml/FontData.js';
import {TeXFont} from './chtml/fonts/tex.js';
import {BIGDIMEN, percent} from '../util/lengths.js';

/*****************************************************************/
/*
 *  Implements the CHTML class (extends AbstractOutputJax)
 */

export class CHTML extends AbstractOutputJax {

    public static NAME: string = 'CHTML';
    public static OPTIONS: OptionList = {
        ...AbstractOutputJax.OPTIONS,
        scale: 1,                      // Global scaling factor for all expressions
        skipAttributes: {},            // RFDa and other attributes NOT to copy to CHTML output
        CHTMLWrapperFactory: null,     // The CHTMLWrapper factory to use
        font: null                     // The FontData object to use
    };

    /*
     *  Used to store the HTMLNodes factory, the CHTMLWraper factory, and FontData object.
     */
    public nodes: HTMLNodes;
    public factory: CHTMLWrapperFactory;
    public font: FontData;

    /*
     * The MatahDocument for the math we find
     * and the MathItem currently being processed
     */
    public document: MathDocument;
    public math: MathItem;

    /*
     * A map from the nodes in the expression currently being processed to the
     * wrapper nodes for them (used by functions like core() to locate the wrappers
     * from the core nodes)
     */
    public nodeMap: Map<MmlNode, CHTMLWrapper> = null;

    /*
     * Get the WrapperFactory and connect it to this output jax
     * Get the HTMLNodes instance
     *
     * @param{OptionList} options  The configuration options
     * @constructor
     */
    constructor(options: OptionList = null) {
        super(options);
        this.factory = this.options.CHTMLWrapperFactory || new CHTMLWrapperFactory();
        this.factory.chtml = this;
        this.nodes = new HTMLNodes();
        this.font = this.options.font || new TeXFont();
    }

    /*
     * Save the math document and the math item
     * Set the document where HTMLNodes will be created
     * Recusrively set the TeX classes for the nodes
     * Create the container mjx-chtml node
     * Create the CHTML output for the root MathML node in the container
     *
     * @override
     */
    public typeset(math: MathItem, html: MathDocument) {
        this.document = html;
        this.math = math;
        this.nodes.document(html.document);
        math.root.setTeXclass(null);
        let node = this.html('mjx-chtml', {'class': 'MathJax_CHTML MJX-TEX'});
        const scale = math.metrics.scale * this.options.scale;
        if (scale !== 1) {
            node.style.fontSize = percent(scale);
        }
        this.nodeMap = new Map<MmlNode, CHTMLWrapper>();
        this.toCHTML(math.root, node);
        this.nodeMap = null;
        return node;
    }

    /*
     * @override
     */
    public escaped(math: MathItem, html: MathDocument) {
        this.nodes.document(html.document);
        return this.html('span', {}, [this.text(math.math)]);
    }

    /*
     * @override
     */
    public getMetrics(html: MathDocument) {
        for (const math of html.math) {
            math.setMetrics(16, 8, 1000000, 1000000, 1);
        }
    }

    /*
     * @override
     */
    public styleSheet(html: MathDocument) {
        return null as Element;
    }

    /*
     * @param{MmlNode} node  The MML node whose HTML is to be produced
     * @param{HTMLElement} parent  The HTML node to contain the HTML
     */
    public toCHTML(node: MmlNode, parent: HTMLElement) {
        return this.factory.wrap(node).toCHTML(parent);
    }

    /*
     * @param{string} type  The type of HTML node to create
     * @param{OptionList} def  The properties to set on the HTML node
     * @param{Node[]} content  Array of child nodes to set for the HTML node
     *
     * @return{HTMLElement} The newly created HTML tree
     */
    public html(type: string, def: OptionList = {}, content: Node[] = []) {
        return this.nodes.node(type, def, content);
    }

    /*
     * @param{string} text  The text string for which to make a text node
     *
     * @return{HTMLElement}  A text node with the given text
     */
    public text(text: string) {
        return this.nodes.text(text);
    }

}
