'''
Business: Управление данными игрока и таблицей лидеров
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с данными игрока или списком лидеров
'''

import json
import os
import psycopg2
from typing import Dict, Any

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'leaderboard')
            
            if action == 'leaderboard':
                cursor.execute('''
                    SELECT nickname, total_clicks, click_power, auto_click_rate
                    FROM players
                    ORDER BY total_clicks DESC
                    LIMIT 10
                ''')
                rows = cursor.fetchall()
                leaderboard = [
                    {
                        'nickname': row[0],
                        'totalClicks': int(row[1]),
                        'clickPower': int(row[2]),
                        'autoClickRate': float(row[3])
                    }
                    for row in rows
                ]
                
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'leaderboard': leaderboard})
                }
            
            elif action == 'player':
                player_id = event.get('queryStringParameters', {}).get('playerId', '')
                if not player_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'playerId required'})
                    }
                
                cursor.execute('''
                    SELECT nickname, total_clicks, click_power, auto_click_rate, upgrades, achievements
                    FROM players
                    WHERE player_id = %s
                ''', (player_id,))
                row = cursor.fetchone()
                
                cursor.close()
                conn.close()
                
                if row:
                    upgrades_data = row[4] if row[4] else []
                    achievements_data = row[5] if row[5] else []
                    
                    player_data = {
                        'nickname': row[0],
                        'totalClicks': int(row[1]),
                        'clickPower': int(row[2]),
                        'autoClickRate': float(row[3]),
                        'upgrades': upgrades_data,
                        'achievements': achievements_data
                    }
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps(player_data)
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Player not found'})
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            player_id = body_data.get('playerId', '')
            nickname = body_data.get('nickname', 'Аноним')
            
            if not player_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'playerId required'})
                }
            
            cursor.execute('''
                INSERT INTO players (player_id, nickname)
                VALUES (%s, %s)
                ON CONFLICT (player_id) DO NOTHING
                RETURNING nickname, total_clicks, click_power, auto_click_rate
            ''', (player_id, nickname))
            
            row = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            if row:
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'nickname': row[0],
                        'totalClicks': int(row[1]),
                        'clickPower': int(row[2]),
                        'autoClickRate': float(row[3])
                    })
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'message': 'Player already exists'})
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            player_id = body_data.get('playerId', '')
            
            if not player_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'playerId required'})
                }
            
            update_fields = []
            params = []
            
            if 'nickname' in body_data:
                update_fields.append('nickname = %s')
                params.append(body_data['nickname'])
            if 'totalClicks' in body_data:
                update_fields.append('total_clicks = %s')
                params.append(int(body_data['totalClicks']))
            if 'clickPower' in body_data:
                update_fields.append('click_power = %s')
                params.append(int(body_data['clickPower']))
            if 'autoClickRate' in body_data:
                update_fields.append('auto_click_rate = %s')
                params.append(float(body_data['autoClickRate']))
            if 'upgrades' in body_data:
                update_fields.append('upgrades = %s')
                params.append(json.dumps(body_data['upgrades']))
            if 'achievements' in body_data:
                update_fields.append('achievements = %s')
                params.append(json.dumps(body_data['achievements']))
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(player_id)
            
            query = f'''
                UPDATE players
                SET {', '.join(update_fields)}
                WHERE player_id = %s
                RETURNING nickname, total_clicks, click_power, auto_click_rate, upgrades, achievements
            '''
            
            cursor.execute(query, params)
            row = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            if row:
                upgrades_data = row[4] if row[4] else []
                achievements_data = row[5] if row[5] else []
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'nickname': row[0],
                        'totalClicks': int(row[1]),
                        'clickPower': int(row[2]),
                        'autoClickRate': float(row[3]),
                        'upgrades': upgrades_data,
                        'achievements': achievements_data
                    })
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Player not found'})
                }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }