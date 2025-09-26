import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { MoneyValue } from "./MoneyValue";

@Entity("treasures")
export class Treasure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: "decimal",
  })
  latitude: number;

  @Column({
    type: "decimal",
  })
  longitude: number;

  @OneToMany(() => MoneyValue, (moneyValue) => moneyValue.treasure)
  moneyValues: MoneyValue[];
}
