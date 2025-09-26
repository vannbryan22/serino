import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from "typeorm";
import { Treasure } from "./Treasure";

@Entity("money_values")
export class MoneyValue {
  @PrimaryColumn()
  id: number;

  @Column()
  @Index("idx_treasure_id")
  treasure_id: number;

  @Column()
  amt: string;

  @ManyToOne(() => Treasure, (treasure) => treasure.moneyValues)
  @JoinColumn({ name: "treasure_id" })
  treasure: Treasure;
}
