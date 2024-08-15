import { _decorator, Component, Label, Node } from 'cc';
import { GridCell } from './GridCell';
const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    @property
    public grids: GridCell[] = [];
    @property
    public boardSize: number = 10;
    @property
    public cellSize: number = 68;
    @property
    public spacing: number = 2;
    @property(Node)
    public container: Node

    start() {
        var count : number = 0;
        this.container.children.forEach(child => {
            const cell = child.getComponent(GridCell);
            if (cell) {
                this.grids.push(cell);
                cell.coordinate.x = this.container.children.indexOf(child) % this.boardSize;
                cell.coordinate.y = Math.floor(this.container.children.indexOf(child) / this.boardSize);
                //cell.label.string = cell.coordinate.x.toString() + "," + cell.coordinate.y.toString();
                cell.initTexture = cell.sprite.spriteFrame;
            }
        });
    }

    update(deltaTime: number) {
        
    }
}

