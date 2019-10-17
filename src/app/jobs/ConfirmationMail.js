import Mail from '../../lib/Mail'

class ConfirmationMail {
  /*
   * Cada job precisa de uma chave única
   */
  get key() {
    return 'ConfirmationMail'
  }

  async handle({ data }) {
    const { meetup, user } = data

    console.log('A fila executou')

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}`,
      subject: `${meetup.title} Nova Inscrição`,
      template: 'confirmation',
      context: {
        organizer: meetup.user.name,
        meetup: meetup.title,
        user: user.name,
        email: user.email,
      },
    })
  }
}

export default new ConfirmationMail()
