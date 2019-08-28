import React from "react";
import { get, memoize } from "lodash-es";
import ReactDOM from "react-dom";
import { canUseDOM } from "exenv-es6";
import Foundation, { HandledProps } from "@microsoft/fast-components-foundation-react";
import {
    PivotHandledProps,
    PivotManagedClasses,
    PivotUnhandledProps,
} from "./pivot.props";
import {
    ManagedClasses,
    PivotClassNameContract,
} from "@microsoft/fast-components-class-name-contracts-msft";
import { TabsClassNameContract } from "@microsoft/fast-components-class-name-contracts-base";
import { Direction } from "@microsoft/fast-web-utilities";
import { toPx } from "@microsoft/fast-jss-utilities";
import { PivotBase } from "../pivot-base";
import { OutlineButton } from "../outline-button"
import { PivotProps } from ".";
import { DisplayNamePrefix } from "../utilities";

export interface PivotState {
    offsetX: number;
    indicatorWidth: number;
    activeId: string;
    tabPanelIndex: number;
    // windowInnerWidth: number;
}

class Pivot extends Foundation<PivotHandledProps, PivotUnhandledProps, PivotState> {
    public static displayName: string = `${DisplayNamePrefix}Pivot`;

    /**
     * React life-cycle method
     */
    public static getDerivedStateFromProps(
        nextProps: PivotProps,
        prevState: PivotState
    ): null | Partial<PivotState> {
        if (nextProps.activeId && nextProps.activeId !== prevState.activeId) {
            return {
                activeId: nextProps.activeId,
            };
        }

        return null;
    }

    private tabsRef: React.RefObject<PivotBase>;

    private ltr: Direction;

    private prevTabPanelIndex: number;

    /**
     * The constructor
     */
    constructor(props: PivotProps) {
        super(props);

        if (Array.isArray(this.props.items)) {
            this.state = {
                offsetX: 0,
                indicatorWidth: 0,
                tabPanelIndex: 0,
                activeId:
                    typeof this.props.activeId === "string"
                        ? this.props.activeId
                        : get(this.props.items[0], "id", ""),
            };
        }

        this.tabsRef = React.createRef();
    }

    public componentDidMount(): void {
        this.ltr = this.getLTR();
        this.setActiveIndicatorOffset();
        this.prevTabPanelIndex = this.state.tabPanelIndex;
    }

    public componentDidUpdate(prevProps: PivotProps, prevState: PivotState): void {
        if (this.ltr !== this.getLTR()) {
            this.setActiveIndicatorOffset();
            this.ltr = this.getLTR();
        }

        if (this.state.activeId !== prevState.activeId) {
            this.setActiveIndicatorOffset();
            this.updateTabPanelIndex();
        }

        if (this.state.tabPanelIndex !== prevState.tabPanelIndex) {
            this.prevTabPanelIndex = this.state.tabPanelIndex;
        }
    }

    protected handledProps: HandledProps<PivotHandledProps> = {
        label: void 0,
        items: void 0,
        managedClasses: void 0,
    };

    /**
     * Renders the component
     */
    public render(): React.ReactElement<HTMLDivElement> {
        console.log("managed classes", this.props.managedClasses)
        return (
            <PivotBase
                {...this.unhandledProps()}
                ref={this.tabsRef}
                activeId={this.state.activeId}
                onUpdate={this.handleTabsUpdate}
                items={this.props.items}
                label={this.props.label}
                
                className={this.generateClassNames()}
                jssStyleSheet={this.pivotStyleOverrides(this.state.offsetX)}
            />
        );
    }

    /**
     * Returns tabs managedclasses with new carousel-specific JSS
     */
    protected generatePivotClassNames(): TabsClassNameContract {
        if (typeof get(this.props, "managedClasses") === "object") {
            return {
                tabs: get(this.props, "managedClasses.pivot"),
                tabs_tabPanels: this.generateTabPanelsClassNames(),
                tabs_tabList: get(this.props, "managedClasses.pivot_tabList"),
                tabs_tabContent: get(this.props, "managedClasses.pivot_tabContent"),
                tabs_tabPanelContent: get(
                    this.props,
                    "managedClasses.pivot_tabPanelContent"
                ),
                tab: get(this.props, "managedClasses.pivot_tab"),
                tab__active: get(this.props, "managedClasses.pivot_tab__active"),
                tabPanel: get(this.props, "managedClasses.pivot_tabPanel"),
                tabPanel__hidden: get(
                    this.props,
                    "managedClasses.pivot_tabPanel__hidden"
                ),
            };
        }
    }

    private pivotStyleOverrides = memoize((offset: number) => ({
        pivot_tabList: {
            "&::before": {
                left: `${toPx(offset)}`,
                transition: "all 0.2s ease-in-out"
            }
        }
      }))

    private handleTabsUpdate = (activeTabId: string): void => {
        this.setState({
            activeId: activeTabId,
        });
    };

    private isSelected(element: HTMLElement): boolean {
        return element.attributes["aria-selected"].value === "true";
    }

    private updateTabPanelIndex(): void {
        if (canUseDOM() && this.tabsRef.current && Array.isArray(this.props.items)) {
            const tabElement: HTMLElement = ReactDOM.findDOMNode(
                this.tabsRef.current
            ) as HTMLElement;

            const mytabsArray: HTMLElement[] = Array.prototype.slice.call(
                tabElement.querySelectorAll("[role='tab']")
            );

            this.setState({
                tabPanelIndex: mytabsArray.findIndex(this.isSelected),
            });
        }
    }

    // private generateTabPanelsClassNames(): string {
    //     let className: string = get(this.props, "managedClasses.pivot_tabPanels");
    //     if (typeof className === "string") {
    //         if (this.state.tabPanelIndex === this.prevTabPanelIndex) {
    //             return className;
    //         } else if (this.state.tabPanelIndex < this.prevTabPanelIndex) {
    //             className = `${className} ${get(
    //                 this.props,
    //                 "managedClasses.pivot_tabPanels__animatePrevious",
    //                 ""
    //             )}`;
    //         } else {
    //             className = `${className} ${get(
    //                 this.props,
    //                 "managedClasses.pivot_tabPanels__animateNext",
    //                 ""
    //             )}`;
    //         }

    //         return className;
    //     }
    // }

    private setActiveIndicatorOffset(): void {
        if (canUseDOM() && this.tabsRef.current && Array.isArray(this.props.items)) {
            const tabElement: HTMLElement = ReactDOM.findDOMNode(
                this.tabsRef.current
            ) as HTMLElement;

            const mytab: HTMLElement = tabElement.querySelector("[aria-selected='true']");

            if (mytab !== null && tabElement !== null) {
                const width: number = mytab.getBoundingClientRect().width;
                const center: number = width / 2;
                const offsetX: number = mytab.offsetLeft +
                center - 10;

                this.setState({
                    offsetX,
                    indicatorWidth: width
                });
            }
        }
    }

    // TODO #1438: Add optional direction prop to Pivot and Horizontal overflow
    /**
     * Gets the direction of the element
     */
    private getLTR(): Direction {
        if (canUseDOM()) {
            const tabElement: HTMLElement = ReactDOM.findDOMNode(
                this.tabsRef.current
            ) as HTMLElement;

            return !tabElement
                ? Direction.ltr
                : getComputedStyle(tabElement).direction === Direction.rtl
                    ? Direction.rtl
                    : Direction.ltr;
        }
    }
}

export default Pivot;
export * from "./pivot.props";
