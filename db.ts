import * as mysql from 'mysql';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecommerce',
  port: 3306,
  timezone: 'local',
});
