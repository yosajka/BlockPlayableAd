import { _decorator, Component, Node, Tween, Vec3 } from 'cc';
import { Board } from './Board';
import { Block } from './Block';
import { GridCell } from './GridCell';
const { ccclass, property } = _decorator;

@ccclass('Gameplay')
export class Gameplay extends Component {
    @property(Board) 
    public board: Board;
    // @export var block_scene: PackedScene
    @property(Block)
    public blocks: Block[] = [];
    @property(Node)
    public point_label: Node;
    @property(Node)
    public win_screen: Node;
    @property(Node)
    public download_button: Node;
    @property(Node) 
    public home_download_button: Node;
    @property
    public timer: number = 10;

    @property(Node) canvas: Node;
    @property(Node) streak_2: Node;
    @property(Node) streak_3: Node;
    @property(Node) tutorial_screen: Node;
    @property(Node) tutorial_position: Node;
    

    @property(Node) bgm: Node;
    @property(Node) placeSFX: Node;
    @property(Node) winSFX: Node;

    currentBlock: Block | null = null;
    cellsToRemove: GridCell[] = [];
    point: number
    time: number
    streak: number
    is_tutorial: boolean = true
    isVfx: boolean = false
    // tutorial_tween: Tween
    tutorial_hand: Node
    
    start() {
        //this.currentBlock = this.blocks[0];
        this.blocks.forEach(block => {
            block.blockPlaced.on('blockPlaced', this.onBlockPlaced, this);
            block.blockClicked.on('blockClicked', this.onBlockClicked, this);
            block.blockReleased.on('blockReleased', this.onBlockReleased, this);
        })
    }

    update(deltaTime: number) {        
        if (this.currentBlock != null && this.currentBlock.dragging) {
            console.log('block clicked');
            var first = this.currentBlock.grids[0];
            var first_position = first.node.worldPosition;
            var overlap_grid_cells = this.board.grids.filter((x) => Vec3.distance(x.node.worldPosition, first_position) < 25);
            overlap_grid_cells = overlap_grid_cells.filter((x) => x.state == GridCell.STATE.EMPTY || x.state == GridCell.STATE.HOVERED);
            if (overlap_grid_cells.length > 0) {
                overlap_grid_cells.sort((a, b) => {
                    if (Vec3.distance(a.node.worldPosition, first_position) < Vec3.distance(b.node.worldPosition, first_position)) {
                        return -1;
                    }
                    if (Vec3.distance(a.node.worldPosition, first_position) > Vec3.distance(b.node.worldPosition, first_position)) {
                        return 1;
                    }
                    return 0; 
                });
                first.setGridCell(overlap_grid_cells[0]);

                for (let i = 1; i < this.currentBlock.grids.length; i++) {
                    let block_cell = this.currentBlock.grids[i];
                    let grid_cell_coord = overlap_grid_cells[0].coordinate.add(block_cell.coordinate);
                    if (grid_cell_coord.x < this.board.boardSize && grid_cell_coord.y < this.board.boardSize) {
                        let grid_cell = this.board.grids[grid_cell_coord.y * this.board.boardSize + grid_cell_coord.x];
                        if (grid_cell.state == GridCell.STATE.EMPTY) {
                            block_cell.setGridCell(grid_cell);
                        }
                    }
                }

                if (this.currentBlock.canPlace()) {
                    this.getCellsToRemove();
                }
                else {
                    this.clearCellsToRemove();
                }
            }
            else {
                this.clearCellsToRemove();
            }
        }
		
    }

    abv(block: Block) {
        this.currentBlock = block;
    }

    onBlockClicked(block: Block) {
        if (!this.isVfx) {
            this.currentBlock = block;
        } 
        // console.log("before", this.timer);
        // this.timer = 9999;
        // console.log("after", this.timer);
        // setTimeout(() => {
        //     console.log('Delayed check:', this.timer);
        // }, 1000);
        
    }

    onBlockPlaced(block: Block) {
        
    }

    onBlockReleased(block: Block) {

    }

    getCellsToRemove() {
        this.cellsToRemove = [];
        this.currentBlock.getXCoord();
        this.currentBlock.getYCoord();
        for (let y of this.currentBlock.yCoord) {
            var cells = this.board.grids.filter(x => x.coordinate.y == y && x.state != GridCell.STATE.EMPTY);
            if (cells.length != this.board.boardSize) {
                continue;
            }
            for (let cell of cells) {
                if (this.cellsToRemove.indexOf(cell) === -1) {
                    this.cellsToRemove.push(cell);
                    cell.sprite.spriteFrame = this.currentBlock.grids[0].sprite.spriteFrame;
                }
            }
        }
        for (let x of this.currentBlock.xCoord) {
            var cells = this.board.grids.filter(n => n.coordinate.x == x && n.state != GridCell.STATE.EMPTY);
            if (cells.length != this.board.boardSize) {
                continue;
            }
            cells.forEach(cell => {
                if (this.cellsToRemove.indexOf(cell) === -1) {
                    this.cellsToRemove.push(cell);
                    cell.sprite.spriteFrame = this.currentBlock.grids[0].sprite.spriteFrame;
                }
            })
        }
    }

    clearCellsToRemove() {
        this.cellsToRemove.forEach(cell => {
            cell.sprite.spriteFrame = cell.initTexture;
        })
        this.cellsToRemove = [];
    }
}

