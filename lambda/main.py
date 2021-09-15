
def lambda_handler(event, context):
    message = 'Hello {} {}!'.format("World", "Singapore")
    return {
        'message': message
    }
