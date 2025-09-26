import { MigrationInterface, QueryRunner } from "typeorm";
import * as path from "path";
import * as csvtojson from "csvtojson";
import * as bcrypt from "bcrypt";

export class Migration1758777018931 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(255) NOT NULL,
        \`age\` VARCHAR(255) NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`id\`)
        );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`treasures\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(255) NOT NULL,
        \`latitude\` DECIMAL(15, 12) NOT NULL,
        \`longitude\` DECIMAL(16, 12) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`money_values\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`treasure_id\` INT UNSIGNED NOT NULL,
        \`amt\` DECIMAL(15, 2) NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_treasure_id\` (\`treasure_id\`),
        CONSTRAINT \`FK_money_values_treasure_id\`
          FOREIGN KEY (\`treasure_id\`)
          REFERENCES \`treasures\`(\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB;
    `);

    const usersPath = path.join(__dirname, "../assets/", "serino-users.csv");
    const jsonUsers = await csvtojson().fromFile(usersPath);

    for (let index = 0; index < jsonUsers?.length; index++) {
      const user = jsonUsers[index];
      if (index === 0) continue;

      const hashedPassword = await bcrypt.hash(user.field5, 10);
      await queryRunner.query(
        `INSERT INTO users (id, name, age, password, email)
        VALUES ('${user.field2}', '${user.field3}', '${user.field4}', '${hashedPassword}', '${user.field6}');`,
      );
    }

    const treasuresPath = path.join(
      __dirname,
      "../assets/",
      "serino-treasures.csv",
    );
    const jsonTreasures = await csvtojson().fromFile(treasuresPath);

    for (let index = 0; index < jsonTreasures?.length; index++) {
      const treasure = jsonTreasures[index];
      if (index === 0) continue;

      await queryRunner.query(
        `INSERT INTO treasures (id, latitude, longitude, name)
        VALUES ('${treasure.field2}', '${treasure.field3}', '${treasure.field4}', '${treasure.field5}');`,
      );
    }

    const moneyValuesPath = path.join(
      __dirname,
      "../assets/",
      "serino-money-values.csv",
    );
    const jsonMoneyValues = await csvtojson().fromFile(moneyValuesPath);

    for (let index = 0; index < jsonMoneyValues?.length; index++) {
      const moneyValue = jsonMoneyValues[index];
      if (index === 0) continue;

      await queryRunner.query(
        `INSERT INTO money_values (treasure_id, amt)
        VALUES ('${moneyValue.field2}', '${moneyValue.field3}');`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
