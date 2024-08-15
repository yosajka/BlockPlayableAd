import { _decorator, Component, Label, Node, tween, Tween, Vec3 } from 'cc';
import { Board } from './Board';
import { Block } from './Block';
import { GridCell } from './GridCell';
import { BlockCell } from './BlockCell';
const { ccclass, property } = _decorator;

@ccclass('Gameplay')
export class Gameplay extends Component {
    @property(Board) 
    public board: Board;
    // @export var block_scene: PackedScene
    @property(Block)
    public blocks: Block[] = [];
    @property(Label)
    public pointLabel: Label;
    @property(Node)
    public winScreen: Node;
    @property(Node)
    public download_button: Node;
    @property(Node) 
    public home_download_button: Node;
    @property
    public timer: number = 10;

    @property(Node) canvas: Node;
    @property(Node) streak_2: Node;
    @property(Node) streak_3: Node;
    @property(Node) tutorialScreen: Node;
    @property 
    publictutorialPosition: Vec3;
    

    @property(Node) bgm: Node;
    @property(Node) placeSFX: Node;
    @property(Node) winSFX: Node;

    currentBlock: Block | null = null;
    cellsToRemove: GridCell[] = [];
    point: number = 0;
    time: number;
    streak: number;
    isTutorial: boolean = true;
    isVfx: boolean = false;
    // tutorial_tween: Tween
    tutorialHand: Node;
    
    start() {
        //this.currentBlock = this.blocks[0];
        this.blocks.forEach(block => {
            block.blockPlaced.on('blockPlaced', this.onBlockPlaced, this);
            block.blockClicked.on('blockClicked', this.onBlockClicked, this);
            block.blockReleased.on('blockReleased', this.onBlockReleased, this);
        })

        this.updatePoint();

        // if (this.isTutorial) {
        //     let tutorialBlock = this.blocks[2] as Block;
        //     this.tutorialHand = tutorialBlock.node.getChildByName('Hand');
        //     let tutorial_tween = tween(tutorialBlock.node).repeatForever(
        //         tween(tutorialBlock.node)
        //         .set({ position: tutorialBlock.initPosition })
        //         .to(1, { position: this.tutorialPosition })
        //         .delay(1)
        //         .set({ position: tutorialBlock.initPosition })
        //         .to(1, { position: this.tutorialPosition })
        //         .delay(1)
        //     ).start();
            
        // }
    }

    update(deltaTime: number) {        
        if (this.currentBlock != null && this.currentBlock.dragging) {
            var first : BlockCell = this.currentBlock.grids[0];
            var first_position : Vec3 = first.node.worldPosition;
            var overlap_grid_cells : GridCell[] = this.board.grids.filter((x) => Vec3.distance(x.node.worldPosition, first_position) < 25);
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
                    let grid_cell_coord = overlap_grid_cells[0].coordinate.clone().add(block_cell.coordinate);
                    if (grid_cell_coord.x < this.board.boardSize && grid_cell_coord.y < this.board.boardSize) {
                        let grid_cell = this.board.grids[grid_cell_coord.y * this.board.boardSize + grid_cell_coord.x];
                        if (grid_cell.state == GridCell.STATE.EMPTY) {
                            // console.log(block_cell.name);
                            // console.log("grid_cell ", first.gridCell.coordinate);
                            // console.log("grid_cell_coord: ", grid_cell_coord);
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
        this.blocks = this.blocks.filter(b => b !== block);
        block.node.destroy();

        if (this.cellsToRemove.length > 0) {
            this.cellsToRemove.forEach(cell => {
                cell.sprite.spriteFrame = cell.emptyTexture;
                cell.state = GridCell.STATE.EMPTY;
                this.point += 1000;
            })

            this.cellsToRemove = [];
            this.updatePoint();
            this.updateStreak();
            this.showCombo(block);
        }

        if (this.blocks.length <= 0) {
            setTimeout(() => {
                this.winScreen.active = true;
            }, 1000);
        }
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

    updatePoint() {
        this.pointLabel.string = this.point.toString();
    }

    updateStreak() {
        
    }

    showCombo(block: Block) {
        
    }
}

