/*
 * Licensed to the OpenAirInterface (OAI) Software Alliance under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The OpenAirInterface Software Alliance licenses this file to You under 
 * the Apache License, Version 2.0  (the "License"); you may not use this file
 * except in compliance with the License.  
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *-------------------------------------------------------------------------------
 * For more information about the OpenAirInterface (OAI) Software Alliance:
 *      contact@openairinterface.org
 */

#include <stdint.h>
#include <stdbool.h>

#include "TLVEncoder.h"
#include "TLVDecoder.h"
#include "DeactivateEpsBearerContextAccept.h"
#include "common_defs.h"

int decode_deactivate_eps_bearer_context_accept(
  deactivate_eps_bearer_context_accept_msg
    *deactivate_eps_bearer_context_accept,
  uint8_t *buffer,
  uint32_t len)
{
  uint32_t decoded = 0;
  int decoded_result = 0;

  // Check if we got a NULL pointer and if buffer length is >= minimum length expected for the message.
  CHECK_PDU_POINTER_AND_LENGTH_DECODER(
    buffer, DEACTIVATE_EPS_BEARER_CONTEXT_ACCEPT_MINIMUM_LENGTH, len);

  /*
   * Decoding mandatory fields
   */
  /*
   * Decoding optional fields
   */
  while (len > decoded) {
    uint8_t ieiDecoded = *(buffer + decoded);

    /*
     * Type | value iei are below 0x80 so just return the first 4 bits
     */
    if (ieiDecoded >= 0x80) ieiDecoded = ieiDecoded & 0xf0;

    switch (ieiDecoded) {
      case DEACTIVATE_EPS_BEARER_CONTEXT_ACCEPT_PROTOCOL_CONFIGURATION_OPTIONS_IEI:
        if (
          (decoded_result = decode_protocol_configuration_options_ie(
             &deactivate_eps_bearer_context_accept
                ->protocolconfigurationoptions,
             true,
             buffer + decoded,
             len - decoded)) <= 0)
          return decoded_result;

        decoded += decoded_result;
        /*
       * Set corresponding mask to 1 in presencemask
       */
        deactivate_eps_bearer_context_accept->presencemask |=
          DEACTIVATE_EPS_BEARER_CONTEXT_ACCEPT_PROTOCOL_CONFIGURATION_OPTIONS_PRESENT;
        break;

      default: errorCodeDecoder = TLV_UNEXPECTED_IEI; return TLV_UNEXPECTED_IEI;
    }
  }

  return decoded;
}

int encode_deactivate_eps_bearer_context_accept(
  deactivate_eps_bearer_context_accept_msg
    *deactivate_eps_bearer_context_accept,
  uint8_t *buffer,
  uint32_t len)
{
  int encoded = 0;
  int encode_result = 0;

  /*
   * Checking IEI and pointer
   */
  CHECK_PDU_POINTER_AND_LENGTH_ENCODER(
    buffer, DEACTIVATE_EPS_BEARER_CONTEXT_ACCEPT_MINIMUM_LENGTH, len);

  if (
    (deactivate_eps_bearer_context_accept->presencemask &
     DEACTIVATE_EPS_BEARER_CONTEXT_ACCEPT_PROTOCOL_CONFIGURATION_OPTIONS_PRESENT) ==
    DEACTIVATE_EPS_BEARER_CONTEXT_ACCEPT_PROTOCOL_CONFIGURATION_OPTIONS_PRESENT) {
    if (
      (encode_result = encode_protocol_configuration_options_ie(
         &deactivate_eps_bearer_context_accept->protocolconfigurationoptions,
         true,
         buffer + encoded,
         len - encoded)) < 0)
      // Return in case of error
      return encode_result;
    else
      encoded += encode_result;
  }

  return encoded;
}
